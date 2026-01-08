import {
  isPackageJsonModified,
  detectNewDependencies,
  detectInfrastructureChanges,
} from "../hooks/detector.js";
import { storeHint, clearHints, getHints, Hint } from "../hooks/hints.js";
import { confirm, input, select } from "@inquirer/prompts";
import { createDecision } from "../core/decision.js";

export async function handlePreCommit(): Promise<void> {
  try {
    const modified = await isPackageJsonModified();

    if (modified) {
      const newDeps = await detectNewDependencies();

      if (newDeps.length > 0) {
        await storeHint({
          type: "dependency-added",
          context: {
            dependencies: newDeps,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    const infraChanges = await detectInfrastructureChanges();

    for (const change of infraChanges) {
      await storeHint({
        type: "infrastructure-change",
        context: {
          changedFiles: change.files,
          changeType: change.type,
          timestamp: new Date().toISOString(),
        },
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("⚠️  LDDL pre-commit hook failed:", error);
    process.exit(0);
  }
}

function formatHintDescription(hint: Hint): {
  emoji: string;
  label: string;
  description: string;
} {
  if (hint.type === "dependency-added" && hint.context.dependencies) {
    const deps = hint.context.dependencies.join(", ");
    return {
      emoji: "📦",
      label: "Dependencies",
      description: `New dependencies: ${deps}`,
    };
  } else if (
    hint.type === "infrastructure-change" &&
    hint.context.changedFiles
  ) {
    const changeType = hint.context.changeType || "infrastructure";
    const files = hint.context.changedFiles.join(", ");

    let emoji = "🏗️";
    let label = "Infrastructure";

    if (changeType === "docker") {
      emoji = "🐳";
      label = "Docker";
    } else if (changeType === "ci-cd") {
      emoji = "🔄";
      label = "CI/CD";
    } else if (changeType === "deployment") {
      emoji = "🚀";
      label = "Deployment";
    }

    return {
      emoji,
      label,
      description: `${label} changes: ${files}`,
    };
  }

  return {
    emoji: "📝",
    label: "Change",
    description: "Unknown change detected",
  };
}

function getSuggestedTitle(hint: Hint): string {
  if (hint.type === "dependency-added" && hint.context.dependencies) {
    return `Add ${hint.context.dependencies[0]}${
      hint.context.dependencies.length > 1 ? " and others" : ""
    }`;
  } else if (hint.type === "infrastructure-change") {
    const changeType = hint.context.changeType || "infrastructure";
    const label =
      changeType === "docker"
        ? "Docker"
        : changeType === "ci-cd"
        ? "CI/CD"
        : changeType === "deployment"
        ? "Deployment"
        : "Infrastructure";
    return `Update ${label.toLowerCase()} configuration`;
  }
  return "Technical decision";
}

async function createDecisionForHint(hint: Hint): Promise<void> {
  const suggestedTitle = getSuggestedTitle(hint);

  const title = await input({
    message: "Decision title:",
    default: suggestedTitle,
  });

  const context = await input({
    message: "Context (optional, press Enter to skip):",
    default: "",
  });

  const decision = await input({
    message: "Decision (optional, press Enter to skip):",
    default: "",
  });

  const consequences = await input({
    message: "Consequences (optional, press Enter to skip):",
    default: "",
  });

  await createDecision({
    title,
    ...(context && { context }),
    ...(decision && { decision }),
    ...(consequences && { consequences }),
  });

  console.log("✅ Decision log created!");
}

function groupHints(hints: Hint[]): Hint[] {
  const grouped = new Map<string, Hint>();

  for (const hint of hints) {
    if (hint.type === "dependency-added" && hint.context.dependencies) {
      const existing = grouped.get("dependency-added");
      if (existing && existing.context.dependencies) {
        existing.context.dependencies.push(...hint.context.dependencies);
      } else {
        grouped.set("dependency-added", { ...hint });
      }
    } else if (
      hint.type === "infrastructure-change" &&
      hint.context.changedFiles
    ) {
      const key = `infrastructure-change-${hint.context.changeType}`;
      const existing = grouped.get(key);
      if (existing && existing.context.changedFiles) {
        existing.context.changedFiles.push(...hint.context.changedFiles);
      } else {
        grouped.set(key, { ...hint });
      }
    } else {
      grouped.set(`${hint.type}-${Date.now()}`, hint);
    }
  }

  return Array.from(grouped.values());
}

async function createCombinedDecision(hints: Hint[]): Promise<void> {
  const allDescriptions = hints
    .map((hint) => {
      const { emoji, description } = formatHintDescription(hint);
      return `${emoji} ${description}`;
    })
    .join("\n");

  console.log(
    `\n📋 Creating a decision log for all changes:\n${allDescriptions}\n`
  );

  const title = await input({
    message: "Decision title:",
    default: "Multiple technical changes",
  });

  const contextSuggestion = hints
    .map((hint) => {
      const { description } = formatHintDescription(hint);
      return `- ${description}`;
    })
    .join("\n");

  const context = await input({
    message: "Context (optional, press Enter to skip):",
    default: contextSuggestion,
  });

  const decision = await input({
    message: "Decision (optional, press Enter to skip):",
    default: "",
  });

  const consequences = await input({
    message: "Consequences (optional, press Enter to skip):",
    default: "",
  });

  await createDecision({
    title,
    ...(context && { context }),
    ...(decision && { decision }),
    ...(consequences && { consequences }),
  });

  console.log("✅ Decision log created!");
}

export async function handlePrepareCommitMsg(): Promise<void> {
  try {
    const hints = await getHints();

    if (hints.length === 0) {
      process.exit(0);
      return;
    }

    const groupedHints = groupHints(hints);

    console.log("\n🔍 Changes detected:\n");
    groupedHints.forEach((hint) => {
      const { emoji, description } = formatHintDescription(hint);
      console.log(`   ${emoji} ${description}`);
    });
    console.log();

    if (groupedHints.length > 1) {
      const choice = await select({
        message: "How would you like to proceed?",
        choices: [
          {
            name: "Create one decision log for all changes",
            value: "combined",
            description: "Document all changes in a single decision log",
          },
          {
            name: "Create separate decision logs",
            value: "individual",
            description: "Prompt for each change individually",
          },
          {
            name: "Skip all",
            value: "skip",
            description: "Don't create any decision logs",
          },
        ],
      });

      if (choice === "skip") {
        console.log("\n⏩ Skipped. Continuing with commit...");
        await clearHints();
        process.exit(0);
        return;
      }

      if (choice === "combined") {
        await createCombinedDecision(groupedHints);
        await clearHints();
        process.exit(0);
        return;
      }
    }

    let skipRemaining = false;

    for (let i = 0; i < groupedHints.length; i++) {
      if (skipRemaining) break;

      const hint = groupedHints[i];
      const { emoji, description } = formatHintDescription(hint);

      console.log(`\n${emoji} ${description}\n`);

      const shouldCreate = await confirm({
        message: "Would you like to create a decision log for this?",
        default: false,
      });

      if (shouldCreate) {
        await createDecisionForHint(hint);

        if (i < groupedHints.length - 1) {
          const shouldContinue = await confirm({
            message: `Continue with remaining ${
              groupedHints.length - i - 1
            } change(s)?`,
            default: true,
          });

          if (!shouldContinue) {
            skipRemaining = true;
          }
        }
      } else if (i < groupedHints.length - 1) {
        const checkRemaining = await confirm({
          message: `Skip all remaining ${
            groupedHints.length - i - 1
          } change(s)?`,
          default: false,
        });

        if (checkRemaining) {
          skipRemaining = true;
        }
      }
    }

    await clearHints();
    process.exit(0);
  } catch (error: any) {
    if (error.name === "ExitPromptError") {
      console.log("\n⏩ Skipped. Continuing with commit...");
      await clearHints();
      process.exit(0);
      return;
    }
    console.error("⚠️  LDDL prepare-commit-msg hook failed:", error);
    await clearHints();
    process.exit(0);
  }
}
