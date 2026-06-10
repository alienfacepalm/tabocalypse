/**
 * Regenerates apps/extension/public PNGs (and assets/icon.png) with a transparent
 * background by keying near-black pixels. Run after updating assets/icon.png source art.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const extensionRoot = join(__dirname, "..");
const require = createRequire(
  join(
    extensionRoot,
    "..",
    "..",
    "node_modules",
    ".pnpm",
    "sharp@0.34.5",
    "node_modules",
    "sharp",
    "package.json",
  ),
);
// Sharp is a transitive dependency of @wxt-dev/auto-icons (see pnpm lockfile).
const sharp = require(".");

const BLACK_THRESHOLD = 32;
const SOURCE = join(extensionRoot, "assets", "icon.png");
const PUBLIC_ICON_SIZES = [16, 32, 48, 96, 128, 180] as const;

async function loadTransparentSource(): Promise<Buffer> {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

async function writeSizedPng(source: Buffer, size: number, dest: string): Promise<void> {
  await sharp(source)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(dest);
}

async function main(): Promise<void> {
  const transparent = await loadTransparentSource();
  await sharp(transparent).png().toFile(SOURCE);

  for (const size of PUBLIC_ICON_SIZES) {
    await writeSizedPng(transparent, size, join(extensionRoot, "public", "icon", `${size}.png`));
  }

  await writeSizedPng(transparent, 16, join(extensionRoot, "public", "favicon-16.png"));
  await writeSizedPng(transparent, 32, join(extensionRoot, "public", "favicon-32.png"));
  await writeSizedPng(transparent, 180, join(extensionRoot, "public", "apple-touch-icon.png"));
  await writeSizedPng(transparent, 128, join(extensionRoot, "public", "notification-icon.png"));

  const sample = await sharp(join(extensionRoot, "public", "icon", "32.png")).metadata();
  if (!sample.hasAlpha) {
    throw new Error("Expected public/icon/32.png to have an alpha channel");
  }
  console.log("Wrote transparent PNGs under public/ and assets/icon.png");
}

void main();
