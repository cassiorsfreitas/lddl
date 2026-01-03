import { writeFile, chmod, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";

const execAsync = promisify(exec);

const PRE_COMMIT_TEMPLATE = `#!/usr/bin/env node

// LDDL pre-commit hook
// This hook detects changes and stores hints for later prompting

const { spawn } = require('child_process');

const lddl = spawn('lddl', ['__hook-pre-commit'], {
  stdio: 'inherit',
  shell: true
});

lddl.on('exit', (code) => {
  process.exit(code || 0);
});
`;

const PREPARE_COMMIT_MSG_TEMPLATE = `#!/bin/bash

# LDDL prepare-commit-msg hook
# This hook prompts the user based on detected hints

commitMsgFile="$1"
commitSource="$2"

# Only prompt for regular commits (not merge, squash, or amended commits)
if [ -n "$commitSource" ] && [ "$commitSource" != "message" ]; then
  exit 0
fi

# Check if there are hints
if [ ! -d ".lddl/hints" ] || [ -z "$(ls -A .lddl/hints/*.json 2>/dev/null)" ]; then
  exit 0
fi

# Process each hint
for hint_file in .lddl/hints/*.json; do
  # Extract dependencies from hint file
  deps=$(node -e "const fs=require('fs'); const hint=JSON.parse(fs.readFileSync('$hint_file')); console.log(hint.context.dependencies.join(', '));")
  
  echo ""
  echo "📦 New dependencies detected: $deps"
  echo ""
  
  # Prompt user with direct /dev/tty access
  exec < /dev/tty
  read -p "Would you like to create a decision log for this? (y/N) " -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Extract first dependency for the title
    first_dep=$(node -e "const fs=require('fs'); const hint=JSON.parse(fs.readFileSync('$hint_file')); console.log(hint.context.dependencies[0]);")
    dep_count=$(node -e "const fs=require('fs'); const hint=JSON.parse(fs.readFileSync('$hint_file')); console.log(hint.context.dependencies.length);")
    
    if [ "$dep_count" -eq 1 ]; then
      title="Add $first_dep dependency"
    else
      title="Add $dep_count new dependencies"
    fi
    
    # Collect additional information
    echo "Let's add more context to your decision log..."
    echo ""
    
    read -p "Why did you add this dependency? (Context): " context
    read -p "What will you use it for? (Decision): " decision
    read -p "Any trade-offs or impacts? (Consequences): " consequences
    echo ""
    
    # Build the lddl command with all options
    cmd="lddl new --title \"$title\""
    [ -n "$context" ] && cmd="$cmd --context \"$context\""
    [ -n "$decision" ] && cmd="$cmd --decision \"$decision\""
    [ -n "$consequences" ] && cmd="$cmd --consequences \"$consequences\""
    
    # Execute the command
    eval $cmd
    echo "✓ Decision logged"
  else
    echo "⏭  Skipped"
  fi
  
  # Clean up hint file
  rm "$hint_file"
done

exit 0
`;

async function findGitDir(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("git rev-parse --git-dir");
    return stdout.trim();
  } catch {
    return null;
  }
}

async function installHook(
  hookName: string,
  template: string,
  gitDir: string
): Promise<void> {
  const hookPath = join(gitDir, "hooks", hookName);

  await writeFile(hookPath, template, "utf-8");
  await chmod(hookPath, 0o755); // Make executable

  console.log(`✓ Installed ${hookName} hook`);
}

export async function installGitHooks(): Promise<boolean> {
  const gitDir = await findGitDir();

  if (!gitDir) {
    console.error(
      "❌ Not a git repository. Run this command from inside a git repo."
    );
    return false;
  }

  const hooksDir = join(gitDir, "hooks");

  await mkdir(hooksDir, { recursive: true });

  try {
    await installHook("pre-commit", PRE_COMMIT_TEMPLATE, gitDir);
    await installHook(
      "prepare-commit-msg",
      PREPARE_COMMIT_MSG_TEMPLATE,
      gitDir
    );
    console.log(
      "  Your commits will now be monitored for technical decisions."
    );
    console.log("  You'll be prompted gently when changes are detected.\n");

    return true;
  } catch (error) {
    console.error("❌ Failed to install hooks:", error);
    return false;
  }
}

export async function areHooksInstalled(): Promise<boolean> {
  const gitDir = await findGitDir();

  if (!gitDir) {
    return false;
  }

  const preCommitPath = join(gitDir, "hooks", "pre-commit");
  const prepareCommitMsgPath = join(gitDir, "hooks", "prepare-commit-msg");

  if (!existsSync(preCommitPath) || !existsSync(prepareCommitMsgPath)) {
    return false;
  }

  try {
    const preCommitContent = await readFile(preCommitPath, "utf-8");
    return preCommitContent.includes("LDDL");
  } catch {
    return false;
  }
}
