import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { INewsFeedSnapshot } from "./balanced-news-types";

const { mockBrowser, localGet, localSet } = vi.hoisted(() => {
  const localGet = vi.fn();
  const localSet = vi.fn();
  const mockBrowser = {
    storage: {
      local: { get: localGet, set: localSet },
    },
  };
  return { mockBrowser, localGet, localSet };
});

vi.mock("webextension-polyfill", () => ({
  default: mockBrowser,
}));

const fetchBalancedNewsArticles = vi.fn();
vi.mock("./fetch-balanced-news", () => ({
  fetchBalancedNewsArticles,
}));

vi.mock("./enrich-news-articles-with-thumbnails", () => ({
  enrichNewsArticlesWithKnownThumbnails: (articles: unknown[]) => articles,
}));

vi.mock("./cluster-news-topics", () => ({
  clusterNewsTopics: () => [
    {
      id: "topic-1",
      title: "Cached headline",
      kind: "reporting",
      publishedAt: null,
      articles: [],
      left: null,
      center: null,
      right: null,
      reporting: null,
      balanceScore: 1,
    },
  ],
}));

const { loadBalancedNewsFeed } = await import("./load-balanced-news-feed");

const cachedSnapshot = (): INewsFeedSnapshot => ({
  topics: [
    {
      id: "cached-topic",
      title: "From cache",
      kind: "reporting",
      publishedAt: null,
      articles: [],
      left: null,
      center: null,
      right: null,
      reporting: null,
      balanceScore: 1,
    },
  ],
  fetchedAt: 1_700_000_000_000,
  country: "US",
  category: "politics",
  stale: false,
});

describe("loadBalancedNewsFeed", () => {
  const now = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    localGet.mockReset();
    localSet.mockReset();
    fetchBalancedNewsArticles.mockReset();
    localGet.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("serves fresh cache without calling the provider", async () => {
    localGet.mockResolvedValue({
      tabocalypseBalancedNewsCacheV1: {
        entries: {
          "US:politics": { snapshot: cachedSnapshot(), fetchedAt: now - 60_000 },
        },
      },
      tabocalypseBalancedNewsRlV1: { nextAllowedAt: 0, backoffUntil: 0 },
    });

    const result = await loadBalancedNewsFeed(
      { country: "US", category: "politics", topicCount: 5 },
      undefined,
    );

    expect(result.kind).toBe("cached");
    expect(result.snapshot).not.toBeNull();
    expect(result.snapshot!.topics[0]?.title).toBe("From cache");
    expect(fetchBalancedNewsArticles).not.toHaveBeenCalled();
  });

  it("returns cached headlines when the provider is rate limited", async () => {
    localGet.mockResolvedValue({
      tabocalypseBalancedNewsCacheV1: {
        entries: {
          "US:politics": { snapshot: cachedSnapshot(), fetchedAt: now - 60 * 60 * 1000 },
        },
      },
      tabocalypseBalancedNewsRlV1: { nextAllowedAt: 0, backoffUntil: 0 },
    });
    fetchBalancedNewsArticles.mockRejectedValue(new Error("You exceeded your daily quota"));

    const result = await loadBalancedNewsFeed(
      { country: "US", category: "politics", topicCount: 5, forceRefresh: true },
      undefined,
    );

    expect(result.kind).toBe("rate_limited");
    expect(result.snapshot?.topics[0]?.title).toBe("From cache");
    expect(result.snapshot?.stale).toBe(true);
  });

  it("does not call the provider during rate-limit backoff even on force refresh", async () => {
    localGet.mockResolvedValue({
      tabocalypseBalancedNewsCacheV1: {
        entries: {
          "US:politics": { snapshot: cachedSnapshot(), fetchedAt: now - 60 * 60 * 1000 },
        },
      },
      tabocalypseBalancedNewsRlV1: {
        nextAllowedAt: now + 60_000,
        backoffUntil: now + 3_600_000,
      },
    });

    const result = await loadBalancedNewsFeed(
      { country: "US", category: "politics", topicCount: 5, forceRefresh: true },
      undefined,
    );

    expect(result.kind).toBe("rate_limited");
    expect(result.snapshot?.stale).toBe(true);
    expect(fetchBalancedNewsArticles).not.toHaveBeenCalled();
  });

  it("falls back to cache on generic fetch errors", async () => {
    localGet.mockResolvedValue({
      tabocalypseBalancedNewsCacheV1: {
        entries: {
          "US:politics": { snapshot: cachedSnapshot(), fetchedAt: now - 60 * 60 * 1000 },
        },
      },
      tabocalypseBalancedNewsRlV1: { nextAllowedAt: 0, backoffUntil: 0 },
    });
    fetchBalancedNewsArticles.mockRejectedValue(new Error("HTTP 503"));

    const result = await loadBalancedNewsFeed(
      { country: "US", category: "politics", topicCount: 5, forceRefresh: true },
      undefined,
    );

    expect(result.kind).toBe("cached");
    expect(result.snapshot).not.toBeNull();
    expect(result.snapshot!.stale).toBe(true);
  });
});
