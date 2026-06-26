import { describe, expect, it } from "vitest";
import type { INewsFeedSnapshot, INewsTopicRoundup } from "./balanced-news-types";
import {
  BALANCED_NEWS_CONTENT_STALE_MS,
  formatNewsItemHoverTimestamp,
  isNewsFeedSnapshotContentStale,
  isNewsItemStale,
  isNewsTopicStale,
} from "./balanced-news-staleness";

const topic = (publishedAt: number | null): INewsTopicRoundup => ({
  id: "topic-1",
  title: "Headline",
  kind: "reporting",
  publishedAt,
  articles: [],
  left: null,
  center: null,
  right: null,
  reporting: null,
  balanceScore: 1,
});

describe("balanced-news-staleness", () => {
  const now = 1_700_000_000_000;

  it("marks items older than 72 hours as stale", () => {
    const publishedAt = now - BALANCED_NEWS_CONTENT_STALE_MS - 1;
    expect(isNewsItemStale(publishedAt, now)).toBe(true);
    expect(isNewsItemStale(now - BALANCED_NEWS_CONTENT_STALE_MS, now)).toBe(false);
  });

  it("falls back to fetchedAt when publishedAt is missing", () => {
    const fetchedAt = now - BALANCED_NEWS_CONTENT_STALE_MS - 1;
    expect(isNewsItemStale(null, now, fetchedAt)).toBe(true);
    expect(isNewsItemStale(null, now, now - 60_000)).toBe(false);
  });

  it("treats snapshot as stale when every topic is stale", () => {
    const snapshot: INewsFeedSnapshot = {
      topics: [topic(now - BALANCED_NEWS_CONTENT_STALE_MS - 1)],
      fetchedAt: now - 60_000,
      country: "US",
      category: "politics",
      stale: false,
    };
    expect(isNewsFeedSnapshotContentStale(snapshot, now)).toBe(true);
  });

  it("treats snapshot as stale when fetchedAt is older than 72 hours", () => {
    const snapshot: INewsFeedSnapshot = {
      topics: [topic(now - 60_000)],
      fetchedAt: now - BALANCED_NEWS_CONTENT_STALE_MS - 1,
      country: "US",
      category: "politics",
      stale: false,
    };
    expect(isNewsFeedSnapshotContentStale(snapshot, now)).toBe(true);
  });

  it("does not treat snapshot as stale when at least one topic is fresh", () => {
    const snapshot: INewsFeedSnapshot = {
      topics: [topic(now - BALANCED_NEWS_CONTENT_STALE_MS - 1), topic(now - 60_000)],
      fetchedAt: now - 60_000,
      country: "US",
      category: "politics",
      stale: false,
    };
    expect(isNewsFeedSnapshotContentStale(snapshot, now)).toBe(false);
  });

  it("formats hover timestamps with date and time", () => {
    const formatted = formatNewsItemHoverTimestamp(now, "en-US");
    expect(formatted).toMatch(/\d/);
    expect(formatNewsItemHoverTimestamp(null, "en-US")).toBe("Unknown time");
  });

  it("delegates topic staleness to publishedAt with fetchedAt fallback", () => {
    expect(isNewsTopicStale(topic(now - BALANCED_NEWS_CONTENT_STALE_MS - 1), now)).toBe(true);
    expect(isNewsTopicStale(topic(null), now, now - 60_000)).toBe(false);
  });
});
