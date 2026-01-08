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

export interface InfrastructureChange {
  type: "docker" | "ci-cd" | "deployment";
  files: string[];
}

export async function detectInfrastructureChanges(): Promise<
  InfrastructureChange[]
> {
  try {
    const { stdout } = await execAsync("git diff --cached --name-only");
    const files = stdout.split("\n").filter((f) => f.trim());

    const changes: InfrastructureChange[] = [];

    const dockerFiles = files.filter(
      (f) =>
        f === "Dockerfile" ||
        f === "docker-compose.yml" ||
        f === "docker-compose.yaml" ||
        f.endsWith(".dockerfile") ||
        f.includes("Dockerfile.")
    );

    if (dockerFiles.length > 0) {
      changes.push({ type: "docker", files: dockerFiles });
    }

    const ciFiles = files.filter(
      (f) =>
        f.startsWith(".github/workflows/") ||
        f === ".gitlab-ci.yml" ||
        f.startsWith(".circleci/") ||
        f === "Jenkinsfile" ||
        f === ".travis.yml" ||
        f === "azure-pipelines.yml" ||
        f.startsWith("bitbucket-pipelines")
    );

    if (ciFiles.length > 0) {
      changes.push({ type: "ci-cd", files: ciFiles });
    }

    const deployFiles = files.filter(
      (f) =>
        f.includes("kubernetes/") ||
        f.includes("k8s/") ||
        f.endsWith(".k8s.yml") ||
        f.endsWith(".k8s.yaml") ||
        f.includes("terraform/") ||
        f.endsWith(".tf") ||
        f.endsWith(".tfvars") ||
        f.includes("helm/") ||
        f === "Chart.yaml" ||
        f.includes("ansible/") ||
        (f.endsWith(".yml") && f.includes("deploy"))
    );

    if (deployFiles.length > 0) {
      changes.push({ type: "deployment", files: deployFiles });
    }

    return changes;
  } catch {
    return [];
  }
}
