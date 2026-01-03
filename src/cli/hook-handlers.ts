import {
  isPackageJsonModified,
  detectNewDependencies,
} from "../hooks/detector.js";
import { storeHint, clearHints } from "../hooks/hints.js";

export async function handlePreCommit(): Promise<void> {
  try {
    const modified = await isPackageJsonModified();

    if (!modified) {
      process.exit(0);
      return;
    }

    const newDeps = await detectNewDependencies();

    if (newDeps.length === 0) {
      process.exit(0);
      return;
    }

    await storeHint({
      type: "dependency-added",
      context: {
        dependencies: newDeps,
        timestamp: new Date().toISOString(),
      },
    });

    process.exit(0);
  } catch (error) {
    console.error("⚠️  LDDL pre-commit hook failed:", error);
    process.exit(0);
  }
}
