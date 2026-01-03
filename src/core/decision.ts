import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const getDecisionsDir = () => join(process.cwd(), ".lddl/decisions");

export const createDecision = async ({ title }: { title: string }) => {
  const DECISIONS_DIR = getDecisionsDir();

  await mkdir(DECISIONS_DIR, { recursive: true });

  const timestamp = Date.now();
  const date = new Date().toISOString().split("T")[0];
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${date}-${timestamp}-${slug}.md`;
  const filepath = join(DECISIONS_DIR, filename);

  const content = `# ${title}

**Date:** ${new Date().toISOString()}

## Context

<!-- What is the issue or decision that needs to be made? -->

## Decision

<!-- What did you decide? -->

## Consequences

<!-- What are the trade-offs of this decision? -->

## References

<!-- Links, issues, or other relevant information -->
`;

  await writeFile(filepath, content, "utf-8");
  console.log(`Decision "${title}" created.`);
};
