/**
 * Lists pnpm scripts for the repo root and every workspace package.
 *
 * Usage (repo root): pnpm scripts:list
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

interface IPackageScripts {
  name: string;
  relPath: string;
  scripts: Record<string, string>;
}

function discoverPackageDirs(): string[] {
  const dirs = [root];
  for (const base of ["apps", "packages"] as const) {
    const basePath = join(root, base);
    if (!existsSync(basePath)) {
      continue;
    }
    for (const entry of readdirSync(basePath, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const pkgDir = join(basePath, entry.name);
      if (existsSync(join(pkgDir, "package.json"))) {
        dirs.push(pkgDir);
      }
    }
  }
  return dirs;
}

function readPackageScripts(pkgDir: string): IPackageScripts {
  const pkgPath = join(pkgDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
    name?: string;
    scripts?: Record<string, string>;
  };
  const name =
    typeof pkg.name === "string" && pkg.name.trim() ? pkg.name.trim() : relative(root, pkgDir);
  const scripts = pkg.scripts ?? {};
  return { name, relPath: relative(root, pkgDir) || ".", scripts };
}

function formatRunCommand(pkg: IPackageScripts, scriptName: string): string {
  if (pkg.relPath === ".") {
    return `pnpm ${scriptName}`;
  }
  return `pnpm --filter ${pkg.name} ${scriptName}`;
}

function truncateCommand(command: string, maxLen: number): string {
  if (command.length <= maxLen) {
    return command;
  }
  return `${command.slice(0, maxLen - 1)}…`;
}

function main(): void {
  const packages = discoverPackageDirs()
    .map(readPackageScripts)
    .sort((a, b) => a.relPath.localeCompare(b.relPath));

  const scriptNameWidth = packages.reduce((max, pkg) => {
    const names = Object.keys(pkg.scripts);
    return Math.max(max, ...names.map((name) => name.length), 0);
  }, 0);

  let total = 0;

  for (const pkg of packages) {
    const entries = Object.entries(pkg.scripts).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) {
      continue;
    }

    console.log(`\n${pkg.name} (${pkg.relPath})`);
    for (const [scriptName, command] of entries) {
      const run = formatRunCommand(pkg, scriptName).padEnd(scriptNameWidth + 12);
      console.log(`  ${run}  ${truncateCommand(command, 72)}`);
      total += 1;
    }
  }

  if (total === 0) {
    console.log("No pnpm scripts found in this workspace.");
    return;
  }

  console.log(
    `\n${total} script${total === 1 ? "" : "s"} across ${packages.filter((p) => Object.keys(p.scripts).length > 0).length} package(s).`,
  );
}

main();
