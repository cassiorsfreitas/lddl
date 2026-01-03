import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const getDecisionsDir = () => join(process.cwd(), ".lddl/decisions");

export interface DecisionInput {
  title: string;
  context?: string;
  decision?: string;
  consequences?: string;
  references?: string;
}

export const createDecision = async (input: DecisionInput) => {
  const { title, context, decision, consequences, references } = input;
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

${context || "<!-- What is the issue or decision that needs to be made? -->"}

## Decision

${decision || "<!-- What did you decide? -->"}

## Consequences

${consequences || "<!-- What are the trade-offs of this decision? -->"}

## References

${references || "<!-- Links, issues, or other relevant information -->"}
`;

  await writeFile(filepath, content, "utf-8");
  console.log(`Decision "${title}" created.`);
};
