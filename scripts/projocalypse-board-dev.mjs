#!/usr/bin/env node
/** Run Projocalypse with Tabocalypse .projocalypse/ JSON bridge served at /.projocalypse/ */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkPmStale, formatPmStaleMessage } from "./lib/pm-stale-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projDeps = join(root, "packages/projocalypse/node_modules/react");

if (!existsSync(projDeps)) {
  console.error(
    "Projocalypse UI dependencies are missing. Run `pnpm pm:setup` (or `pnpm install` from repo root), then retry `pnpm pm:board`.",
  );
  process.exit(1);
}

const stale = checkPmStale(root);
if (stale.stale) {
  console.warn(`${formatPmStaleMessage(stale)}\n`);
}

const child = spawn(
  "pnpm",
  [
    "--filter",
    "projocalypse",
    "exec",
    "vite",
    "--config",
    "../../scripts/projocalypse-host-vite.mjs",
  ],
  { cwd: root, stdio: "inherit", shell: true },
);

child.on("exit", (code) => process.exit(code ?? 0));
