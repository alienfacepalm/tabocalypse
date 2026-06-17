/**
 * Tabocalypse roadmap plan → Projocalypse pending JSON bridge.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPendingFromPlan,
  pendingPath,
  resolveProjocalypsePaths,
  validatePendingSync,
} from "@projocalypse/core";
import { parseRoadmapPlanMarkdown } from "./parse-roadmap-plan.mjs";

export const TABOCALYPSE_ROADMAP_PACKAGE = "tabocalypse-roadmap";

/**
 * @param {string} root Tabocalypse repo root
 * @param {{ packageName?: string; dryRun?: boolean }} [options]
 */
export function runPmRoadmapBridge(root, options = {}) {
  const packageName = options.packageName ?? TABOCALYPSE_ROADMAP_PACKAGE;
  const workspacePath = join(root, ".projocalypse/workspace.json");
  const workspace = JSON.parse(readFileSync(workspacePath, "utf8"));
  const entry = workspace.packages[packageName];
  if (!entry) {
    throw new Error(`Missing ${packageName} in workspace.json`);
  }

  const items = [];
  for (const glob of entry.planGlobs) {
    if (glob.includes("**")) continue;
    const file = join(root, glob);
    try {
      const content = readFileSync(file, "utf8");
      items.push(
        ...parseRoadmapPlanMarkdown(content, glob, {
          defaultSection: entry.defaultSection,
          doneSection: entry.doneSection,
        }),
      );
    } catch {
      // optional plan files may not exist yet
    }
  }

  const paths = resolveProjocalypsePaths(root);
  const planCacheOut = join(paths.planCacheDir, `${packageName}.json`);
  const pendingOut = pendingPath(paths, packageName);

  const pending = buildPendingFromPlan(packageName, items, entry, {
    existingPlanIds: new Set(),
  });
  validatePendingSync(pending);

  if (!options.dryRun) {
    mkdirSync(paths.planCacheDir, { recursive: true });
    mkdirSync(paths.pendingDir, { recursive: true });
    writeFileSync(
      planCacheOut,
      `${JSON.stringify(
        {
          packageName,
          generatedAt: new Date().toISOString(),
          files: entry.planGlobs,
          items,
          summary: {
            total: items.length,
            done: items.filter((i) => i.done).length,
            open: items.filter((i) => !i.done).length,
          },
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(pendingOut, `${JSON.stringify(pending, null, 2)}\n`);
  }

  return {
    packageName,
    itemCount: items.length,
    planCachePath: planCacheOut,
    pendingPath: pendingOut,
    pending,
    items,
  };
}
