export const BING_HP_ARCHIVE =
  "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=en-US";

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

/**
 * Fetches the current Bing spotlight batch (typically 8 images).
 *
 * Call this from the new-tab extension page. Bing does not send CORS headers; some Chrome builds
 * still surface a CORS failure for the same `fetch()` from the MV3 service worker even when
 * `host_permissions` include `https://www.bing.com/*`, while the extension page request is allowed.
 */
export async function fetchBingWallpaperImageUrls(signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(BING_HP_ARCHIVE, { signal });
  if (!res.ok) throw new Error(`Bing wallpaper HTTP ${res.status}`);
  const data: unknown = await res.json();
  return wallpaperUrlsFromBingArchiveJson(data);
}

/**
 * Picks an image from the batch so the spotlight rotates over time without extra storage.
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
