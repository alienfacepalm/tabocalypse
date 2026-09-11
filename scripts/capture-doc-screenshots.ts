/**
 * Capture documentation screenshots from a built Chromium extension.
 *
 * Usage (repo root, after `pnpm build` or `pnpm build:chrome`):
 *   pnpm screenshots:docs
 *
 * Loads `apps/extension/output/chrome_edge-mv3` into a throwaway headless Chromium
 * profile via Playwright, drives the new-tab page (first-run welcome, HUD, Settings
 * sections, individual panels) and writes PNG/JPEG files to `doc/assets/screenshots/`.
 *
 * Live data (weather, wallpaper, crypto) comes from the same public endpoints the
 * extension uses, so captures vary a little from run to run. Re-run after any visual
 * change worth showing in the docs or on the marketing site.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type BrowserContext, type Locator, type Page } from "playwright";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const EXTENSION_DIR = path.join(REPO_ROOT, "apps", "extension", "output", "chrome_edge-mv3");
const OUT_DIR = path.join(REPO_ROOT, "doc", "assets", "screenshots");
const VIEWPORT = { width: 1600, height: 1000 } as const;
/** Fixed pause after navigation so live panels (weather, crypto, wallpaper) have data. */
const SETTLE_MS = 7000;

interface ICaptureOptions {
  /** Use JPEG for photo-heavy full-page shots (wallpaper); PNG for crisp UI elements. */
  jpeg?: boolean;
}

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function captureFile(target: Page | Locator, name: string, opts: ICaptureOptions = {}) {
  const file = path.join(OUT_DIR, opts.jpeg ? `${name}.jpg` : `${name}.png`);
  await target.screenshot(
    opts.jpeg ? { path: file, type: "jpeg", quality: 82 } : { path: file, type: "png" },
  );
  log(`  wrote ${path.relative(REPO_ROOT, file)}`);
}

async function resolveExtensionId(context: BrowserContext): Promise<string> {
  const existing = context.serviceWorkers()[0];
  const worker = existing ?? (await context.waitForEvent("serviceworker", { timeout: 30000 }));
  return new URL(worker.url()).host;
}

async function settle(page: Page, ms = SETTLE_MS): Promise<void> {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  // Park the pointer in the left gutter so no hover tooltip ends up in a capture.
  await page.mouse.move(8, Math.round(VIEWPORT.height / 2));
  await page.waitForTimeout(ms);
}

function settingsDialog(page: Page): Locator {
  return page.locator('div.settings-dialog[role="dialog"][aria-label="Settings"]');
}

async function openSettings(page: Page): Promise<Locator> {
  const dialog = settingsDialog(page);
  if ((await dialog.count()) === 0) {
    await page.locator('button[aria-label="Settings"]').first().click();
    await dialog.waitFor({ state: "visible" });
  }
  return dialog;
}

async function closeSettings(page: Page): Promise<void> {
  const dialog = settingsDialog(page);
  if ((await dialog.count()) === 0) return;
  await dialog.locator("header.dialog-head button", { hasText: "Close" }).click();
  await dialog.waitFor({ state: "hidden" });
}

function sectionByTitle(dialog: Locator, title: string): Locator {
  return dialog.locator("details.acc-item", {
    has: dialog.page().locator("span.acc-title", { hasText: title }),
  });
}

async function setSectionOpen(dialog: Locator, title: string, open: boolean): Promise<Locator> {
  const section = sectionByTitle(dialog, title).first();
  const isOpen = await section.evaluate((el) => (el as HTMLDetailsElement).open);
  if (isOpen !== open) {
    await section.locator("summary.acc-summary").first().click();
  }
  return section;
}

/** Collapse the sections that are open by default, expand `title`, scroll it to the top. */
async function showOnlySection(page: Page, title: string): Promise<Locator> {
  const dialog = await openSettings(page);
  for (const defaultOpen of ["Widgets", "Chaos"]) {
    if (defaultOpen !== title) await setSectionOpen(dialog, defaultOpen, false);
  }
  const section = await setSectionOpen(dialog, title, true);
  await section.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
  return dialog;
}

async function pressChip(dialog: Locator, label: string): Promise<void> {
  await dialog.getByRole("button", { name: label, exact: true }).first().click();
  await dialog.page().waitForTimeout(300);
}

/** Seattle — the 2 Lakes buoy panel and the Pacific Northwest data sources make sense there. */
const SEED_LOCATION = { lat: 47.6062, lon: -122.3321 } as const;

interface ISyncSliceSeed {
  weatherLat: number;
  weatherLon: number;
  weatherGeoAdjusted: boolean;
  prefsSavedAt: number;
}

/**
 * Write shared HUD coordinates into the synced settings slice and its local mirror
 * (both keys are read by `loadSettings`; the newer `prefsSavedAt` wins).
 */
async function seedHudLocation(page: Page, loc: { lat: number; lon: number }): Promise<void> {
  await page.evaluate(
    async (seed: ISyncSliceSeed) => {
      const syncKey = "tabocalypseSync";
      const mirrorKey = "tabocalypseSyncMirror";
      const current = await chrome.storage.sync.get(syncKey);
      const base = (current[syncKey] ?? {}) as Record<string, unknown>;
      const next = { ...base, ...seed };
      await chrome.storage.sync.set({ [syncKey]: next });
      await chrome.storage.local.set({ [mirrorKey]: next });
    },
    {
      weatherLat: loc.lat,
      weatherLon: loc.lon,
      weatherGeoAdjusted: true,
      prefsSavedAt: Date.now() + 1000,
    },
  );
}

async function dismissToasts(page: Page): Promise<void> {
  const dismiss = page.locator('button[aria-label="Dismiss notification"]');
  const count = await dismiss.count();
  for (let i = 0; i < count; i += 1) {
    await dismiss
      .first()
      .click({ timeout: 2000 })
      .catch(() => undefined);
  }
  // Drop keyboard focus (a focused resize handle shows its HUD tip) and park the pointer.
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  });
  await page.mouse.move(8, Math.round(VIEWPORT.height / 2));
  await page.waitForTimeout(300);
}

async function capturePanel(page: Page, panelId: string, name: string): Promise<void> {
  const panel = page.locator(`[data-hud-panel-id="${panelId}"]`).first();
  if ((await panel.count()) === 0) {
    log(`  skip ${name}: panel "${panelId}" is not mounted`);
    return;
  }
  await captureFile(panel, name);
}

async function main(): Promise<void> {
  if (!fs.existsSync(path.join(EXTENSION_DIR, "manifest.json"))) {
    throw new Error(
      `No built extension at ${EXTENSION_DIR}. Run \`pnpm build\` (or \`pnpm build:chrome\`) first.`,
    );
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "tabocalypse-shots-"));

  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "chromium",
    headless: true,
    viewport: { ...VIEWPORT },
    colorScheme: "dark",
    args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`],
  });

  try {
    const extensionId = await resolveExtensionId(context);
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/newtab.html`);
    await settle(page);

    // 1. First-run welcome (Settings opens automatically on a fresh profile).
    log("first-run welcome");
    await settingsDialog(page).waitFor({ state: "visible" });
    await captureFile(page, "first-run-welcome", { jpeg: true });

    // 2. Dismiss welcome, pick the Balanced personality for a calm default HUD, and give the
    //    geo panels a real location so the "default location still active" notices go away.
    const dialog = await openSettings(page);
    await dialog.getByRole("button", { name: "Got it", exact: true }).click();
    await setSectionOpen(dialog, "Chaos", true);
    await pressChip(dialog, "Balanced");
    await closeSettings(page);
    await seedHudLocation(page, SEED_LOCATION);
    await page.reload();
    await settle(page);
    await dismissToasts(page);

    log("HUD (Balanced personality)");
    await captureFile(page, "hud-default", { jpeg: true });

    // 3. Individual panels.
    log("panels");
    await capturePanel(page, "weather", "panel-weather");
    await capturePanel(page, "clock", "panel-clock");
    await capturePanel(page, "crypto", "panel-crypto");
    await capturePanel(page, "todo", "panel-todo");
    await capturePanel(page, "notes", "panel-notes");
    await capturePanel(page, "steamCharts", "panel-steam-leaderboard");

    // 4. Settings sections.
    log("settings sections");
    await showOnlySection(page, "Widgets");
    await captureFile(settingsDialog(page), "settings-widgets");
    await showOnlySection(page, "Appearance");
    await captureFile(settingsDialog(page), "settings-appearance");
    await showOnlySection(page, "Chaos");
    await captureFile(settingsDialog(page), "settings-chaos");
    await showOnlySection(page, "Panel layout");
    await captureFile(settingsDialog(page), "settings-panel-layout");
    await showOnlySection(page, "Import declarative plugin");
    await captureFile(settingsDialog(page), "settings-import-plugin");
    await showOnlySection(page, "Data");
    await captureFile(settingsDialog(page), "settings-data");
    await showOnlySection(page, "Optional permissions");
    await captureFile(settingsDialog(page), "settings-optional-permissions");

    // 5. One more widget on the same monitor (Speed test), repacked with Rearrange.
    //    Balanced news is left off: it needs a live third-party feed and would show an
    //    error panel when that feed is down, which is not a useful documentation image.
    log("HUD with extra widgets");
    {
      const widgets = await showOnlySection(page, "Widgets");
      await pressChip(widgets, "Show Speed test on this monitor");
      await closeSettings(page);
      await page.locator('button[aria-label="Rearrange HUD panels (F10)"]').first().click();
      await settle(page, 6000);
      await dismissToasts(page);
      await captureFile(page, "hud-more-widgets", { jpeg: true });
      await capturePanel(page, "speedTest", "panel-speed-test");
    }

    // 6. Focus personality (status line hidden, humor off).
    log("HUD (Focus personality)");
    {
      const chaos = await showOnlySection(page, "Chaos");
      await pressChip(chaos, "Focus");
      await closeSettings(page);
      await settle(page, 2000);
      await dismissToasts(page);
      await captureFile(page, "hud-focus", { jpeg: true });
    }

    // 7. Light base mode (accent palette stays on Auto HUD wallpaper sampling).
    log("HUD (Light mode)");
    {
      const appearance = await showOnlySection(page, "Appearance");
      await pressChip(appearance, "Light");
      await closeSettings(page);
      await settle(page, 2000);
      await dismissToasts(page);
      await captureFile(page, "hud-light", { jpeg: true });
    }

    log(`done → ${path.relative(REPO_ROOT, OUT_DIR)}`);
  } finally {
    await context.close();
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
