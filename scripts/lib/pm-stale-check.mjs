/**
 * Detect when committed pending JSON is behind plan markdown.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { runPmRoadmapBridge, TABOCALYPSE_ROADMAP_PACKAGE } from "./pm-roadmap-bridge.mjs";

const PLAN_FILES = ["doc/PLAN/ROADMAP-PM-BOARD.md"];

/**
 * @param {unknown} upserts
 */
function upsertsFingerprint(upserts) {
  return createHash("sha256")
    .update(JSON.stringify(upserts ?? []))
    .digest("hex");
}

/**
 * @param {string} root
 */
export function checkPmStale(root) {
  const pendingPath = join(root, ".projocalypse/pending/tabocalypse-roadmap.json");
  const reasons = [];

  if (!existsSync(pendingPath)) {
    return {
      stale: true,
      packageName: TABOCALYPSE_ROADMAP_PACKAGE,
      pendingPath,
      reasons: ["Missing .projocalypse/pending/tabocalypse-roadmap.json — run `pnpm pm:sync`."],
      fix: "pnpm pm:sync",
    };
  }

  const pending = JSON.parse(readFileSync(pendingPath, "utf8"));
  const generatedAtMs = Date.parse(pending.generatedAt ?? "");
  let latestPlanMtime = 0;

  for (const rel of PLAN_FILES) {
    const planPath = join(root, rel);
    if (!existsSync(planPath)) continue;
    latestPlanMtime = Math.max(latestPlanMtime, statSync(planPath).mtimeMs);
  }

  if (Number.isFinite(generatedAtMs) && latestPlanMtime > generatedAtMs + 500) {
    reasons.push(
      "Plan markdown changed after pending JSON was generated — run `pnpm pm:sync` and commit the updated pending file.",
    );
  }

  try {
    const fresh = runPmRoadmapBridge(root, { dryRun: true });
    const freshFingerprint = upsertsFingerprint(fresh.pending.upserts);
    const committedFingerprint = upsertsFingerprint(pending.upserts);
    if (freshFingerprint !== committedFingerprint) {
      reasons.push(
        "Pending JSON does not match current plan — run `pnpm pm:sync` and commit `.projocalypse/pending/tabocalypse-roadmap.json`.",
      );
    }
  } catch (err) {
    reasons.push(err instanceof Error ? err.message : String(err));
  }

  return {
    stale: reasons.length > 0,
    packageName: TABOCALYPSE_ROADMAP_PACKAGE,
    pendingPath,
    generatedAt: pending.generatedAt ?? null,
    latestPlanMtime: latestPlanMtime ? new Date(latestPlanMtime).toISOString() : null,
    reasons,
    fix: "git pull origin master && pnpm pm:sync",
  };
}

/**
 * @param {{ stale?: boolean; reasons?: string[]; fix?: string }} result
 */
export function formatPmStaleMessage(result) {
  if (!result.stale) {
    return "PM board sync is up to date with plan markdown.";
  }
  return [
    "⚠ Tabocalypse PM board sync is STALE",
    ...result.reasons.map((r) => `  • ${r}`),
    "",
    `Fix: ${result.fix ?? "pnpm pm:sync"}`,
  ].join("\n");
}
