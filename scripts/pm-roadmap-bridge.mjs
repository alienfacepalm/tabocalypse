#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPmRoadmapBridge } from "./lib/pm-roadmap-bridge.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  const result = runPmRoadmapBridge(root);
  console.log(
    `pm-roadmap: ${result.itemCount} plan items → ${result.pendingPath.replace(/\\/g, "/")}`,
  );
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
