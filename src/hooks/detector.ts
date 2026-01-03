import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function isPackageJsonModified(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("git diff --cached --name-only");
    return stdout.split("\n").some((file) => file.trim() === "package.json");
  } catch {
    return false;
  }
}

async function getPackageJsonFromGit(ref: string): Promise<PackageJson | null> {
  try {
    const { stdout } = await execAsync(`git show ${ref}:package.json`);
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function getAllDeps(pkg: PackageJson): Set<string> {
  const deps = new Set<string>();

  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach((dep) => deps.add(dep));
  }

  if (pkg.devDependencies) {
    Object.keys(pkg.devDependencies).forEach((dep) => deps.add(dep));
  }

  return deps;
}

export async function detectNewDependencies(): Promise<string[]> {
  const newPkg = await getPackageJsonFromGit(":0");

  if (!newPkg) {
    return [];
  }

  const oldPkg = await getPackageJsonFromGit("HEAD");

  if (!oldPkg) {
    const allDeps = getAllDeps(newPkg);
    return Array.from(allDeps);
  }

  const oldDeps = getAllDeps(oldPkg);
  const newDeps = getAllDeps(newPkg);

  const added: string[] = [];

  for (const dep of newDeps) {
    if (!oldDeps.has(dep)) {
      added.push(dep);
    }
  }

  return added;
}
