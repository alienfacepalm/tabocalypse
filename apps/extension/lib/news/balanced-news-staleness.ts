import type { INewsFeedSnapshot, INewsTopicRoundup } from "./balanced-news-types";

/** Headlines older than this are treated as stale for refresh and UI marking. */
export const BALANCED_NEWS_CONTENT_STALE_MS = 72 * 60 * 60 * 1000;

export function resolveNewsItemPublishedAt(
  publishedAt: number | null,
  fallbackFetchedAt?: number,
): number | null {
  if (publishedAt != null && publishedAt > 0) return publishedAt;
  if (fallbackFetchedAt != null && fallbackFetchedAt > 0) return fallbackFetchedAt;
  return null;
}

export function isNewsItemStale(
  publishedAt: number | null,
  now: number = Date.now(),
  fallbackFetchedAt?: number,
): boolean {
  const ts = resolveNewsItemPublishedAt(publishedAt, fallbackFetchedAt);
  if (ts == null) return false;
  return now - ts > BALANCED_NEWS_CONTENT_STALE_MS;
}

export function isNewsTopicStale(
  topic: INewsTopicRoundup,
  now: number = Date.now(),
  fallbackFetchedAt?: number,
): boolean {
  return isNewsItemStale(topic.publishedAt, now, fallbackFetchedAt);
}

export function isNewsFeedSnapshotContentStale(
  snapshot: INewsFeedSnapshot,
  now: number = Date.now(),
): boolean {
  if (now - snapshot.fetchedAt > BALANCED_NEWS_CONTENT_STALE_MS) return true;
  if (snapshot.topics.length === 0) return false;
  return snapshot.topics.every((topic) => isNewsTopicStale(topic, now, snapshot.fetchedAt));
}

/** Precise timestamp for hover verification (date + time in the user's locale). */
export function formatNewsItemHoverTimestamp(ms: number | null, locale: string): string {
  if (ms == null || ms <= 0) return "Unknown time";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}
