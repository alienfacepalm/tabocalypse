import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));

/** Monorepo root (parent of `scripts/`). */
export const repoRoot = resolve(scriptsDir, "../..");
