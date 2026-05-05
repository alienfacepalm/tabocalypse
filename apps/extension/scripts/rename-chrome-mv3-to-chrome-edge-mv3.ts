import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, "..", "output");
const chromeMv3Dir = path.join(outputDir, "chrome-mv3");
const chromeEdgeMv3Dir = path.join(outputDir, "chrome_edge-mv3");

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.stat(targetPath);
    return true;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

if (await pathExists(chromeMv3Dir)) {
  if (await pathExists(chromeEdgeMv3Dir)) {
    await fs.rm(chromeEdgeMv3Dir, { recursive: true, force: true });
  }

  await fs.rename(chromeMv3Dir, chromeEdgeMv3Dir);
  console.log(`Renamed build output folder to ${path.basename(chromeEdgeMv3Dir)}`);
}
