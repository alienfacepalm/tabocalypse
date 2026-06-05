import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

export type TStoreZipKind = "extension" | "firefox-sources";

export interface IVerifyStoreZipOptions {
  expectedVersion?: string;
  kind?: TStoreZipKind;
}

export interface IVerifyStoreZipResult {
  ok: boolean;
  errors: string[];
  manifestVersion?: string;
}

function runTar(args: string[]): { stdout: string; status: number | null } {
  const result = spawnSync("tar", args, {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return { stdout: result.stdout?.trim() ?? "", status: result.status };
}

function normalizeZipEntry(entry: string): string {
  return entry.replace(/^\.\//, "");
}

/** Lists paths inside a zip archive (requires `tar` with zip support). */
export function listZipEntries(zipPath: string): string[] {
  const { stdout, status } = runTar(["-tf", zipPath]);
  if (status !== 0) {
    throw new Error(`tar -tf failed for ${zipPath}`);
  }
  return stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map(normalizeZipEntry)
    .filter((entry) => entry !== "." && entry !== "");
}

/** True when `manifest.json` is at the archive root, not nested in a folder. */
export function hasManifestAtZipRoot(entries: string[]): boolean {
  return entries.includes("manifest.json");
}

export function readManifestFromZip(zipPath: string): Record<string, unknown> {
  const { stdout, status } = runTar(["-xOf", zipPath, "manifest.json"]);
  if (status !== 0) {
    throw new Error(`Could not read manifest.json from ${zipPath}`);
  }
  return JSON.parse(stdout) as Record<string, unknown>;
}

export function hasFirefoxSourcesAtZipRoot(entries: string[]): boolean {
  return entries.includes("wxt.config.ts") && entries.includes("package.json");
}

export function verifyStoreZip(
  zipPath: string,
  options: IVerifyStoreZipOptions = {},
): IVerifyStoreZipResult {
  const kind = options.kind ?? "extension";
  const errors: string[] = [];
  let manifestVersion: string | undefined;

  let entries: string[];
  try {
    entries = listZipEntries(zipPath);
  } catch (error) {
    return { ok: false, errors: [String(error)] };
  }

  if (kind === "firefox-sources") {
    if (!hasFirefoxSourcesAtZipRoot(entries)) {
      errors.push(
        "Firefox sources zip must include wxt.config.ts and package.json at the archive root",
      );
    }
    return { ok: errors.length === 0, errors, manifestVersion };
  }

  if (!hasManifestAtZipRoot(entries)) {
    errors.push("manifest.json must be at the zip root (not in a subfolder)");
  }

  try {
    const manifest = readManifestFromZip(zipPath);
    if (typeof manifest.version === "string") {
      manifestVersion = manifest.version;
      if (options.expectedVersion && manifest.version !== options.expectedVersion) {
        errors.push(
          `manifest version ${manifest.version} does not match expected ${options.expectedVersion}`,
        );
      }
    } else {
      errors.push("manifest.json missing version field");
    }
  } catch (error) {
    errors.push(`Failed to read manifest.json: ${String(error)}`);
  }

  return { ok: errors.length === 0, errors, manifestVersion };
}

/** Confirms two deliverable files are byte-identical (Chrome vs Edge copy). */
export function verifyIdenticalFiles(pathA: string, pathB: string): boolean {
  const statA = statSync(pathA);
  const statB = statSync(pathB);
  if (statA.size !== statB.size) {
    return false;
  }
  const hashA = createHash("sha256").update(readFileSync(pathA)).digest("hex");
  const hashB = createHash("sha256").update(readFileSync(pathB)).digest("hex");
  return hashA === hashB;
}
