/**
 * Builds Tabocalypse store upload artifacts: Chromium zips (Chrome + Edge names), Firefox zips,
 * and a maintainer checklist under apps/extension/output/store-deliverables/.
 *
 * Usage (repo root): pnpm package:stores
 * Flags: --skip-check, --skip-build
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyIdenticalFiles, verifyStoreZip } from "./verify-store-zip";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const extensionDir = join(root, "apps/extension");
const outputDir = join(extensionDir, "output");
const deliverablesDir = join(outputDir, "store-deliverables");

const args = new Set(process.argv.slice(2));
const skipCheck = args.has("--skip-check");
const skipBuild = args.has("--skip-build");

function run(command: string, commandArgs: string[], cwd: string): void {
  const label = [command, ...commandArgs].join(" ");
  console.log(`\n> ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${label}`);
  }
}

function readExtensionVersion(): string {
  const pkgPath = join(extensionDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
  if (typeof pkg.version !== "string" || !pkg.version.trim()) {
    throw new Error("apps/extension/package.json: missing version");
  }
  return pkg.version.trim();
}

function findWxtZip(prefix: string): string {
  const matches = readdirSync(outputDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".zip"))
    .sort();
  const latest = matches.at(-1);
  if (!latest) {
    throw new Error(`Expected WXT zip matching ${prefix}*.zip in ${outputDir}`);
  }
  return join(outputDir, latest);
}

function copyDeliverable(sourcePath: string, destName: string): string {
  const destPath = join(deliverablesDir, destName);
  copyFileSync(sourcePath, destPath);
  return destPath;
}

/** Zip directory contents so manifest.json is at the archive root (tar -a is cross-platform). */
function zipDirectoryContents(sourceDir: string, destZip: string): void {
  if (!existsSync(sourceDir)) {
    throw new Error(`Expected build output folder: ${sourceDir}`);
  }
  const destDir = dirname(destZip);
  const destName = basename(destZip);
  mkdirSync(destDir, { recursive: true });
  run("tar", ["-a", "-cf", destName, "-C", sourceDir, "."], destDir);
}

function writeDeliverablesManifest(version: string, files: string[]): void {
  const geckoId =
    process.env.WXT_TABOCALYPSE_FIREFOX_GECKO_ID?.trim() ??
    "tabocalypse@alienfacepalm.invalid (placeholder — set in apps/extension/.env)";
  const lines = [
    "# Tabocalypse store deliverables",
    "",
    `Generated for version **${version}**. Upload artifacts from this folder; see [\`doc/CROSS-BROWSER-PUBLISHING-PLAN.md\`](../../../../doc/CROSS-BROWSER-PUBLISHING-PLAN.md).`,
    "",
    "## Packages in this folder",
    "",
    ...files.map((f) => `- \`${f}\``),
    "",
    "## Before you upload",
    "",
    "- [ ] `pnpm check` passed",
    "- [ ] Privacy policy hosted at a public HTTPS URL ([`PRIVACY.md`](../../../../PRIVACY.md))",
    "- [ ] Screenshots captured ([`doc/STORE-LISTING.md`](../../../../doc/STORE-LISTING.md))",
    "- [ ] Firefox Gecko ID set: `" + geckoId + "`",
    "- [ ] Chrome Web Store listing copy and permission justifications ready",
    "",
    "## Per store",
    "",
    "| Store | Upload |",
    "| --- | --- |",
    `| Chrome | \`tabocalypse-${version}-chrome.zip\` |`,
    `| Edge | \`tabocalypse-${version}-edge.zip\` (same MV3 build as Chrome) |`,
    `| Firefox (AMO) | \`tabocalypse-${version}-firefox.zip\` + \`tabocalypse-${version}-firefox-sources.zip\` |`,
    `| Safari | \`tabocalypse-${version}-safari-mv3.zip\` (unzip, then \`safari-web-extension-converter\` on macOS) |`,
    "",
  ];
  writeFileSync(join(deliverablesDir, "DELIVERABLES.md"), lines.join("\n"));
}

function verifyDeliverables(
  version: string,
  chromeZip: string,
  edgeZip: string,
  firefoxZip: string,
  firefoxSourcesZip: string,
  safariZipPath: string,
): void {
  const zipChecks: Array<{
    label: string;
    path: string;
    kind?: "extension" | "firefox-sources";
  }> = [
    { label: "Chrome", path: chromeZip },
    { label: "Edge", path: edgeZip },
    { label: "Firefox", path: firefoxZip },
    { label: "Firefox sources", path: firefoxSourcesZip, kind: "firefox-sources" },
    { label: "Safari MV3", path: safariZipPath },
  ];

  for (const { label, path, kind } of zipChecks) {
    const result = verifyStoreZip(path, { expectedVersion: version, kind });
    if (!result.ok) {
      throw new Error(
        `${label} zip failed verification (${path}):\n  - ${result.errors.join("\n  - ")}`,
      );
    }
  }

  if (!verifyIdenticalFiles(chromeZip, edgeZip)) {
    throw new Error("Edge zip must be byte-identical to the Chrome zip");
  }

  console.log("\nAll store zips verified (manifest.json at root, version matches).");
}

function main(): void {
  const version = readExtensionVersion();
  console.log(`Packaging Tabocalypse v${version} for extension stores…`);

  if (!skipCheck) {
    run("pnpm", ["check"], root);
  }

  if (!skipBuild) {
    run("pnpm", ["build"], root);
  }

  mkdirSync(deliverablesDir, { recursive: true });

  run("pnpm", ["exec", "wxt", "zip", "-b", "chrome"], extensionDir);
  const chromeZip = copyDeliverable(
    findWxtZip(`extension-${version}-chrome`),
    `tabocalypse-${version}-chrome.zip`,
  );
  const edgeZip = copyDeliverable(chromeZip, `tabocalypse-${version}-edge.zip`);

  run("pnpm", ["exec", "wxt", "zip", "-b", "firefox", "--sources"], extensionDir);
  const firefoxZip = copyDeliverable(
    findWxtZip(`extension-${version}-firefox`),
    `tabocalypse-${version}-firefox.zip`,
  );
  const firefoxSourcesZip = copyDeliverable(
    findWxtZip(`extension-${version}-sources`),
    `tabocalypse-${version}-firefox-sources.zip`,
  );

  const safariZipPath = join(deliverablesDir, `tabocalypse-${version}-safari-mv3.zip`);
  zipDirectoryContents(join(outputDir, "safari-mv3"), safariZipPath);

  writeDeliverablesManifest(version, [
    `tabocalypse-${version}-chrome.zip`,
    `tabocalypse-${version}-edge.zip`,
    `tabocalypse-${version}-firefox.zip`,
    `tabocalypse-${version}-firefox-sources.zip`,
    `tabocalypse-${version}-safari-mv3.zip`,
  ]);

  verifyDeliverables(version, chromeZip, edgeZip, firefoxZip, firefoxSourcesZip, safariZipPath);

  console.log("\nStore deliverables ready:");
  console.log(`  ${chromeZip}`);
  console.log(`  ${edgeZip}`);
  console.log(`  ${firefoxZip}`);
  console.log(`  ${firefoxSourcesZip}`);
  console.log(`  ${safariZipPath}`);
  console.log(`  ${join(deliverablesDir, "DELIVERABLES.md")}`);
  console.log(`  Safari source folder: ${join(outputDir, "safari-mv3")}`);
}

main();
