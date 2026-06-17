#!/usr/bin/env node
/**
 * First-time (or fresh clone) Projocalypse PM board bootstrap for Tabocalypse.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./lib/paths.mjs";
import { run } from "./lib/run.mjs";

const submoduleDir = join(repoRoot, "packages/projocalypse");
const submoduleGit = join(submoduleDir, ".git");

console.log("Projocalypse PM setup…");

if (!existsSync(submoduleGit)) {
  console.log("Initializing git submodule packages/projocalypse…");
  await run("git", ["submodule", "update", "--init", "--recursive", "packages/projocalypse"], {
    cwd: repoRoot,
  });
}

console.log("Installing Node dependencies…");
await run("pnpm", ["install"], { cwd: repoRoot });

console.log("Building Projocalypse CLI packages…");
await run("pnpm", ["--filter", "projocalypse", "build:cli"], { cwd: repoRoot });

console.log("Syncing roadmap plan → pending JSON…");
await run("node", ["scripts/pm-roadmap-bridge.mjs"], { cwd: repoRoot });

console.log("Running pm:doctor…");
try {
  await run("node", ["packages/projocalypse/packages/cli/dist/index.js", "doctor"], {
    cwd: repoRoot,
  });
} catch {
  console.warn("pm:doctor reported issues — often OK before first board import in the browser.");
}

console.log("\nPM setup complete.");
console.log("  pnpm pm:board     — local board UI (http://127.0.0.1:5173)");
console.log("  pnpm pm:sync      — refresh pending JSON after plan edits");
console.log("  pnpm pm:stale     — check if pending JSON is behind plan markdown");
