import { installGitHooks, areHooksInstalled } from "../hooks/installer.js";

export const initCommand = async () => {
  console.log("🔧 Initializing LDDL in this repository...\n");

  const alreadyInstalled = await areHooksInstalled();

  if (alreadyInstalled) {
    console.log("ℹ️  LDDL hooks are already installed.");
    console.log("   To reinstall, remove the hooks from .git/hooks/ first.\n");
    return;
  }

  const success = await installGitHooks();

  if (!success) {
    process.exit(1);
  }
};
