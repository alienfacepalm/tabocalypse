import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { INewsFeedSnapshot } from "./balanced-news-types";
import {
  BALANCED_NEWS_CACHE_FRESH_MS,
  isBalancedNewsRateLimitError,
  readBalancedNewsCache,
  recordBalancedNewsRateLimit,
  writeBalancedNewsCache,
} from "./balanced-news-cache";
import { RATE_OR_QUOTA_LIMIT_MESSAGE } from "../format-api-error";

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

const sampleSnapshot = (): INewsFeedSnapshot => ({
  topics: [],
  fetchedAt: 1_700_000_000_000,
  country: "US",
  category: "politics",
  stale: false,
});

describe("isBalancedNewsRateLimitError", () => {
  it("detects HTTP 429, quota, and shared rate-limit copy", () => {
    expect(isBalancedNewsRateLimitError("HTTP 429")).toBe(true);
    expect(isBalancedNewsRateLimitError("You exceeded your daily quota")).toBe(true);
    expect(isBalancedNewsRateLimitError(RATE_OR_QUOTA_LIMIT_MESSAGE)).toBe(true);
    expect(isBalancedNewsRateLimitError("Network error")).toBe(false);
  });
});

describe("balanced news cache", () => {
  beforeEach(() => {
    localGet.mockReset();
    localSet.mockReset();
    localGet.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns fresh cached snapshot without forcing stale", async () => {
    const now = 1_700_000_000_000;
    const snapshot = sampleSnapshot();
    localGet.mockResolvedValue({
      tabocalypseBalancedNewsCacheV1: {
        entries: {
          "US:politics": { snapshot, fetchedAt: now - 5 * 60 * 1000 },
        },
      },
      tabocalypseBalancedNewsRlV1: { nextAllowedAt: 0, backoffUntil: 0 },
    });

    const result = await readBalancedNewsCache("US", "politics", now);
    expect(result.snapshot?.stale).toBe(false);
    expect(result.staleOnly).toBe(false);
    expect(result.canRefresh).toBe(true);
  });

  it("marks snapshot stale after fresh window", async () => {
    const now = 1_700_000_000_000;
    const snapshot = sampleSnapshot();
    localGet.mockResolvedValue({
      tabocalypseBalancedNewsCacheV1: {
        entries: {
          "US:politics": {
            snapshot,
            fetchedAt: now - BALANCED_NEWS_CACHE_FRESH_MS - 1,
          },
        },
      },
      tabocalypseBalancedNewsRlV1: { nextAllowedAt: 0, backoffUntil: 0 },
    });

    const result = await readBalancedNewsCache("US", "politics", now);
    expect(result.snapshot?.stale).toBe(true);
    expect(result.staleOnly).toBe(true);
  });

  it("blocks refresh during rate-limit backoff", async () => {
    const now = 1_700_000_000_000;
    localGet.mockResolvedValue({
      tabocalypseBalancedNewsCacheV1: { entries: {} },
      tabocalypseBalancedNewsRlV1: {
        nextAllowedAt: now + 60_000,
        backoffUntil: now + 3_600_000,
      },
    });

    const result = await readBalancedNewsCache("US", "politics", now);
    expect(result.canRefresh).toBe(false);
    expect(result.inRateLimitBackoff).toBe(true);
  });

  it("persists snapshot and refresh gate on write", async () => {
    const now = 1_700_000_000_000;
    localGet.mockResolvedValue({
      tabocalypseBalancedNewsCacheV1: { entries: {} },
      tabocalypseBalancedNewsRlV1: { nextAllowedAt: 0, backoffUntil: 0 },
    });

    await writeBalancedNewsCache("US", "tech", sampleSnapshot(), now);

    expect(localSet).toHaveBeenCalledTimes(1);
    const payload = localSet.mock.calls[0]![0] as Record<string, unknown>;
    const cache = payload.tabocalypseBalancedNewsCacheV1 as {
      entries: Record<string, { snapshot: INewsFeedSnapshot }>;
    };
    expect(cache.entries["US:tech"]?.snapshot.country).toBe("US");
    const rl = payload.tabocalypseBalancedNewsRlV1 as { nextAllowedAt: number };
    expect(rl.nextAllowedAt).toBeGreaterThan(now);
  });

  it("extends backoff on recordBalancedNewsRateLimit", async () => {
    const now = 1_700_000_000_000;
    localGet.mockResolvedValue({
      tabocalypseBalancedNewsCacheV1: { entries: {} },
      tabocalypseBalancedNewsRlV1: { nextAllowedAt: 0, backoffUntil: 0 },
    });

    await recordBalancedNewsRateLimit(now);

    const payload = localSet.mock.calls[0]![0] as Record<string, unknown>;
    const rl = payload.tabocalypseBalancedNewsRlV1 as {
      backoffUntil: number;
      nextAllowedAt: number;
    };
    expect(rl.backoffUntil).toBeGreaterThan(now);
    expect(rl.nextAllowedAt).toBeGreaterThanOrEqual(rl.backoffUntil);
  });
});
