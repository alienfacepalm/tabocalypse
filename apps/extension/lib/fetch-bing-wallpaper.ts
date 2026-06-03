import type { TPeapixBingCountry } from "./bing-wallpaper-country";
import { peapixBingFeedUrl } from "./bing-wallpaper-country";
import { privilegedExtensionFetchJson } from "./privileged-extension-fetch";

/** @deprecated Use {@link peapixBingFeedUrl} with a resolved country. */
export const PEAPIX_BING_FEED_US = peapixBingFeedUrl("us");

/** One Bing spotlight row from the Peapix feed (title is the usual location/description line). */
export interface IBingWallpaperFeedEntry {
  imageUrl: string;
  title: string;
  copyright: string;
}

function peapixEntryImageUrl(item: Record<string, unknown>): string | null {
  const candidates = [item.fullUrl, item.imageUrl, item.url, item.thumbUrl];
  const raw = candidates.find((x) => typeof x === "string" && x.trim());
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.startsWith("https://") ? trimmed : null;
}

/** Parses Peapix `/bing/feed` JSON (array of entries) into image URLs and captions. */
export function bingWallpaperEntriesFromPeapixFeedJson(data: unknown): IBingWallpaperFeedEntry[] {
  if (!Array.isArray(data)) return [];
  const out: IBingWallpaperFeedEntry[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const imageUrl = peapixEntryImageUrl(o);
    if (!imageUrl) continue;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const copyright = typeof o.copyright === "string" ? o.copyright.trim() : "";
    out.push({ imageUrl, title, copyright });
  }
  return out;
}

/** Parses Peapix `/bing/feed` JSON (array of entries) into HTTPS image URLs. */
export function wallpaperUrlsFromPeapixFeedJson(data: unknown): string[] {
  return bingWallpaperEntriesFromPeapixFeedJson(data).map((e) => e.imageUrl);
}

/** User-visible caption for the bottom-right Bing spotlight label (title, else copyright). */
export function bingWallpaperCaptionFromEntry(entry: IBingWallpaperFeedEntry): string {
  if (entry.title) return entry.title;
  if (entry.copyright) return entry.copyright;
  return "";
}

/**
 * Fetches a batch of Bing-style spotlight images (served via Peapix; avoids Bing’s
 * HPImageArchive endpoint, which does not send CORS headers).
 */
export async function fetchBingWallpaperFeed(
  country: TPeapixBingCountry,
  signal?: AbortSignal,
): Promise<IBingWallpaperFeedEntry[]> {
  const data: unknown = await privilegedExtensionFetchJson(peapixBingFeedUrl(country), signal);
  return bingWallpaperEntriesFromPeapixFeedJson(data);
}

/**
 * Fetches Bing spotlight image URLs only (same feed as {@link fetchBingWallpaperFeed}).
 */
export async function fetchBingWallpaperImageUrls(
  country: TPeapixBingCountry,
  signal?: AbortSignal,
): Promise<string[]> {
  const entries = await fetchBingWallpaperFeed(country, signal);
  return entries.map((e) => e.imageUrl);
}

function pickBingWallpaperEntryAtIndex(
  entries: IBingWallpaperFeedEntry[],
  index: number,
): IBingWallpaperFeedEntry {
  if (entries.length === 0) throw new Error("No Bing wallpaper entries");
  return entries[index % entries.length] ?? entries[0]!;
}

/**
 * Picks an image from the batch so the spotlight rotates over time without extra storage.
 * Slot changes every `rotateIntervalMs` milliseconds (minimum one minute).
 */
export function pickRotatingBingWallpaperEntry(
  entries: IBingWallpaperFeedEntry[],
  nowMs = Date.now(),
  rotateIntervalMs = 15 * 60 * 1000,
): IBingWallpaperFeedEntry {
  if (entries.length === 0) throw new Error("No Bing wallpaper entries");
  const step = Math.max(60_000, rotateIntervalMs);
  const slot = Math.floor(nowMs / step);
  return pickBingWallpaperEntryAtIndex(entries, slot);
}

export function pickRotatingBingWallpaperUrl(
  urls: string[],
  nowMs = Date.now(),
  rotateIntervalMs = 15 * 60 * 1000,
): string {
  if (urls.length === 0) throw new Error("No Bing wallpaper URLs");
  const step = Math.max(60_000, rotateIntervalMs);
  const slot = Math.floor(nowMs / step);
  return urls[slot % urls.length] ?? urls[0]!;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Picks one wallpaper per UTC day so Bing can stay static when rotation is off. */
export function pickDailyBingWallpaperEntry(
  entries: IBingWallpaperFeedEntry[],
  nowMs = Date.now(),
): IBingWallpaperFeedEntry {
  if (entries.length === 0) throw new Error("No Bing wallpaper entries");
  const day = Math.floor(nowMs / DAY_MS);
  return pickBingWallpaperEntryAtIndex(entries, day);
}

/** Picks one wallpaper per UTC day so Bing can stay static when rotation is off. */
export function pickDailyBingWallpaperUrl(urls: string[], nowMs = Date.now()): string {
  if (urls.length === 0) throw new Error("No Bing wallpaper URLs");
  const day = Math.floor(nowMs / DAY_MS);
  return urls[day % urls.length] ?? urls[0]!;
}
