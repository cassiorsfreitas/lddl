import { mkdir, writeFile, readFile, readdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const HINTS_DIR = ".lddl/hints";

export interface Hint {
  type: "dependency-added";
  context: {
    dependencies: string[];
    timestamp: string;
  };
}

export async function storeHint(hint: Hint): Promise<void> {
  await mkdir(HINTS_DIR, { recursive: true });

  const filename = `${Date.now()}-${hint.type}.json`;
  const filepath = join(HINTS_DIR, filename);

  await writeFile(filepath, JSON.stringify(hint, null, 2), "utf-8");
}

export async function getHints(): Promise<Hint[]> {
  if (!existsSync(HINTS_DIR)) {
    return [];
  }

  const files = await readdir(HINTS_DIR);
  const hints: Hint[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const filepath = join(HINTS_DIR, file);
    const content = await readFile(filepath, "utf-8");
    hints.push(JSON.parse(content));
  }

  return hints;
}

export async function clearHints(): Promise<void> {
  if (!existsSync(HINTS_DIR)) {
    return;
  }

  const files = await readdir(HINTS_DIR);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    await unlink(join(HINTS_DIR, file));
  }
}
