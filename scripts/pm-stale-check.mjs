#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkPmStale, formatPmStaleMessage } from "./lib/pm-stale-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const result = checkPmStale(root);

console.log(formatPmStaleMessage(result));
process.exit(result.stale ? 1 : 0);
