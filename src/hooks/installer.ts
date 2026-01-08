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

const PREPARE_COMMIT_MSG_TEMPLATE = `#!/usr/bin/env node

// LDDL prepare-commit-msg hook
// This hook prompts the user based on detected hints

const { spawn } = require('child_process');
const fs = require('fs');

const commitMsgFile = process.argv[2];
const commitSource = process.argv[3];

if (commitSource === 'merge' || commitSource === 'squash') {
  process.exit(0);
}

// Open /dev/tty for interactive input in git hooks
const tty = fs.openSync('/dev/tty', 'r');

const lddl = spawn('lddl', ['__hook-prepare-commit-msg', commitMsgFile], {
  stdio: [tty, process.stdout, process.stderr],
  shell: true
});

lddl.on('exit', (code) => {
  fs.closeSync(tty);
  process.exit(code || 0);
});
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
