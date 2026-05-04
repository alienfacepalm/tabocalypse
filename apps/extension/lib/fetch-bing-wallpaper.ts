import browser from "webextension-polyfill";

export const BING_HP_ARCHIVE =
  "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=en-US";

export const TABOCALYPSE_BING_WALLPAPER_URLS_MESSAGE = "tabocalypse:bingWallpaperUrls";

type TBingWallpaperUrlsResponse = { ok: true; urls: string[] } | { ok: false; error: string };

function isBingWallpaperUrlsResponse(v: unknown): v is TBingWallpaperUrlsResponse {
  if (typeof v !== "object" || v === null) return false;
  const ok = (v as { ok?: unknown }).ok;
  if (ok === true) return Array.isArray((v as { urls?: unknown }).urls);
  if (ok === false) return typeof (v as { error?: unknown }).error === "string";
  return false;
}

/** Parses Bing HPImageArchive JSON and returns absolute image URLs. */
export function wallpaperUrlsFromBingArchiveJson(data: unknown): string[] {
  if (typeof data !== "object" || data === null) return [];
  const images = (data as { images?: unknown }).images;
  if (!Array.isArray(images)) return [];
  const out: string[] = [];
  for (const im of images) {
    if (typeof im !== "object" || im === null) continue;
    const url = (im as { url?: unknown }).url;
    if (typeof url !== "string" || !url.trim()) continue;
    const trimmed = url.trim();
    out.push(trimmed.startsWith("http") ? trimmed : `https://www.bing.com${trimmed}`);
  }
  return out;
}

/** Direct fetch (service worker / tests). */
export async function fetchBingWallpaperImageUrlsDirect(signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(BING_HP_ARCHIVE, { signal });
  if (!res.ok) throw new Error(`Bing wallpaper HTTP ${res.status}`);
  const data: unknown = await res.json();
  return wallpaperUrlsFromBingArchiveJson(data);
}

/**
 * Fetches the current Bing spotlight batch (typically 8 images).
 *
 * Extension pages (including `chrome_url_overrides.newtab`) still enforce **web CORS** for
 * `fetch()`. The MV3 service worker does not, so we proxy via `background.ts`.
 */
export async function fetchBingWallpaperImageUrls(_signal?: AbortSignal): Promise<string[]> {
  const res: unknown = await browser.runtime.sendMessage({
    type: TABOCALYPSE_BING_WALLPAPER_URLS_MESSAGE,
  });
  if (res === undefined || res === null) {
    throw new Error("No response from background worker for Bing wallpaper URLs.");
  }
  if (!isBingWallpaperUrlsResponse(res)) {
    throw new Error("Invalid extension message response for Bing wallpaper URLs.");
  }
  if (!res.ok) throw new Error(res.error);
  return res.urls;
}

/**
 * Picks an image from the batch so the background rotates over time without extra storage.
 * Slot changes every `ROTATE_MS` milliseconds.
 */
const ROTATE_MS = 15 * 60 * 1000;

export function pickRotatingBingWallpaperUrl(urls: string[], nowMs = Date.now()): string {
  if (urls.length === 0) throw new Error("No Bing wallpaper URLs");
  const slot = Math.floor(nowMs / ROTATE_MS);
  return urls[slot % urls.length] ?? urls[0]!;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Picks one wallpaper per UTC day so Bing can stay static when rotation is off. */
export function pickDailyBingWallpaperUrl(urls: string[], nowMs = Date.now()): string {
  if (urls.length === 0) throw new Error("No Bing wallpaper URLs");
  const day = Math.floor(nowMs / DAY_MS);
  return urls[day % urls.length] ?? urls[0]!;
}
