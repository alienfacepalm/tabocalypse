/**
 * Increments the semver patch in apps/extension/package.json (extension manifest version).
 * Invoked from Husky pre-commit after lint-staged succeeds.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "apps/extension/package.json");
const raw = readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(raw);
const current = pkg.version;
if (typeof current !== "string") {
  throw new Error("apps/extension/package.json: missing version string");
}
const parts = current.split(".").map((p) => Number.parseInt(p, 10));
if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
  throw new Error(
    `apps/extension/package.json: version must be semver major.minor.patch, got ${JSON.stringify(current)}`,
  );
}
parts[2] += 1;
pkg.version = parts.join(".");
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
