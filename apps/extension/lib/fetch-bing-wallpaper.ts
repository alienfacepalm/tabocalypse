/** Peapix exposes a public JSON feed that mirrors Bing’s daily images (same approach as Fluent New Tab). */
export const PEAPIX_BING_FEED_US = "https://peapix.com/bing/feed?country=us";

/** Parses Peapix `/bing/feed` JSON (array of entries) into HTTPS image URLs. */
export function wallpaperUrlsFromPeapixFeedJson(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  const out: string[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as { fullUrl?: unknown; imageUrl?: unknown; thumbUrl?: unknown; url?: unknown };
    const candidates = [o.fullUrl, o.imageUrl, o.url, o.thumbUrl];
    const raw = candidates.find((x) => typeof x === "string" && x.trim());
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed.startsWith("https://")) out.push(trimmed);
  }
  return out;
}

/**
 * Fetches a batch of Bing-style spotlight images (served via Peapix; avoids Bing’s
 * HPImageArchive endpoint, which does not send CORS headers).
 */
export async function fetchBingWallpaperImageUrls(signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(PEAPIX_BING_FEED_US, { signal, credentials: "omit" });
  if (!res.ok) throw new Error(`Bing wallpaper feed HTTP ${res.status}`);
  const data: unknown = await res.json();
  return wallpaperUrlsFromPeapixFeedJson(data);
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
