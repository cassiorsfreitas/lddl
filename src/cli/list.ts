import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const getDecisionsDir = () => join(process.cwd(), ".lddl/decisions");

export const listCommand = async () => {
  const DECISIONS_DIR = getDecisionsDir();

  if (!existsSync(DECISIONS_DIR)) {
    console.log(
      "No decisions found. Run 'lddl new' to create your first decision."
    );
    return;
  }

  const files = await readdir(DECISIONS_DIR);
  const decisions = files.filter((f) => f.endsWith(".md"));

  if (decisions.length === 0) {
    console.log(
      "No decisions found. Run 'lddl new' to create your first decision."
    );
    return;
  }

  console.log(`\n📋 Found ${decisions.length} decision(s):\n`);

  for (const file of decisions.sort().reverse()) {
    const filepath = join(DECISIONS_DIR, file);
    const content = await readFile(filepath, "utf-8");

    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : file;

    const dateMatch = content.match(/\*\*Date:\*\* (.+)$/m);
    const date = dateMatch
      ? new Date(dateMatch[1]).toLocaleDateString()
      : "Unknown";

    console.log(`  • ${title}`);
    console.log(`    ${date} - ${file}`);
    console.log();
  }
};
