import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  hasFirefoxSourcesAtZipRoot,
  hasManifestAtZipRoot,
  verifyIdenticalFiles,
  verifyStoreZip,
} from "./verify-store-zip";

function makeZip(dir: string, zipPath: string): void {
  const result =
    process.platform === "win32"
      ? spawnSync("tar", ["-a", "-cf", zipPath, "-C", dir, "."], { shell: true })
      : spawnSync("zip", ["-qr", zipPath, "."], { cwd: dir });
  if (result.status !== 0) {
    throw new Error(`zip failed: ${result.stderr?.toString() ?? "unknown error"}`);
  }
}

describe("hasFirefoxSourcesAtZipRoot", () => {
  it("accepts wxt.config.ts and package.json at archive root", () => {
    expect(hasFirefoxSourcesAtZipRoot(["wxt.config.ts", "package.json", "lib/settings.ts"])).toBe(
      true,
    );
  });

  it("rejects archives missing wxt.config.ts", () => {
    expect(hasFirefoxSourcesAtZipRoot(["package.json"])).toBe(false);
  });
});

describe("hasManifestAtZipRoot", () => {
  it("accepts manifest.json at archive root", () => {
    expect(hasManifestAtZipRoot(["manifest.json", "background.js"])).toBe(true);
  });

  it("rejects nested manifest.json", () => {
    expect(hasManifestAtZipRoot(["chrome_edge-mv3/manifest.json"])).toBe(false);
  });
});

describe("verifyIdenticalFiles", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns true for identical files", () => {
    const dir = mkdtempSync(join(tmpdir(), "tabocalypse-verify-"));
    tempDirs.push(dir);
    const pathA = join(dir, "a.bin");
    const pathB = join(dir, "b.bin");
    writeFileSync(pathA, "same-bytes");
    writeFileSync(pathB, "same-bytes");
    expect(verifyIdenticalFiles(pathA, pathB)).toBe(true);
  });

  it("returns false when sizes differ", () => {
    const dir = mkdtempSync(join(tmpdir(), "tabocalypse-verify-"));
    tempDirs.push(dir);
    const pathA = join(dir, "a.bin");
    const pathB = join(dir, "b.bin");
    writeFileSync(pathA, "short");
    writeFileSync(pathB, "longer-bytes");
    expect(verifyIdenticalFiles(pathA, pathB)).toBe(false);
  });
});

describe("verifyStoreZip", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const path of tempDirs.splice(0)) {
      rmSync(path, { recursive: true, force: true });
    }
  });

  it("passes a zip with manifest.json at root and matching version", () => {
    const dir = mkdtempSync(join(tmpdir(), "tabocalypse-verify-"));
    tempDirs.push(dir);
    writeFileSync(
      join(dir, "manifest.json"),
      JSON.stringify({ manifest_version: 3, version: "1.2.3", name: "Test" }),
    );
    const zipPath = join(tmpdir(), `tabocalypse-verify-${Date.now()}.zip`);
    makeZip(dir, zipPath);
    tempDirs.push(zipPath);

    const result = verifyStoreZip(zipPath, { expectedVersion: "1.2.3" });
    expect(result.ok).toBe(true);
    expect(result.manifestVersion).toBe("1.2.3");
  });

  it("validates firefox-sources archives without manifest.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "tabocalypse-verify-"));
    tempDirs.push(dir);
    writeFileSync(join(dir, "wxt.config.ts"), "export default {};\n");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "extension", version: "1.0.0" }),
    );
    const zipPath = join(tmpdir(), `tabocalypse-sources-${Date.now()}.zip`);
    makeZip(dir, zipPath);
    tempDirs.push(zipPath);

    const result = verifyStoreZip(zipPath, { kind: "firefox-sources" });
    expect(result.ok).toBe(true);
  });

  it("fails when manifest version does not match expected", () => {
    const dir = mkdtempSync(join(tmpdir(), "tabocalypse-verify-"));
    tempDirs.push(dir);
    writeFileSync(
      join(dir, "manifest.json"),
      JSON.stringify({ manifest_version: 3, version: "1.0.0", name: "Test" }),
    );
    const zipPath = join(tmpdir(), `tabocalypse-mismatch-${Date.now()}.zip`);
    makeZip(dir, zipPath);
    tempDirs.push(zipPath);

    const result = verifyStoreZip(zipPath, { expectedVersion: "2.0.0" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("does not match expected"))).toBe(true);
  });
});
