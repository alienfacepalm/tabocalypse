import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import {
  PEAPIX_BING_FEED_US,
  fetchBingWallpaperImageUrls,
  pickDailyBingWallpaperUrl,
  pickRotatingBingWallpaperUrl,
  wallpaperUrlsFromPeapixFeedJson,
} from "./fetch-bing-wallpaper";

describe("fetchBingWallpaperImageUrls", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            fullUrl: "https://img.peapix.com/a_1920.jpg",
            thumbUrl: "https://img.peapix.com/a_640.jpg",
          },
        ],
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches Peapix Bing feed and returns absolute image URLs", async () => {
    const urls = await fetchBingWallpaperImageUrls();
    expect(urls).toEqual(["https://img.peapix.com/a_1920.jpg"]);
    expect(fetch).toHaveBeenCalledWith(PEAPIX_BING_FEED_US, {
      signal: undefined,
      credentials: "omit",
      cache: "no-store",
    });
  });

  it("passes AbortSignal to fetch", async () => {
    const ac = new AbortController();
    await fetchBingWallpaperImageUrls(ac.signal);
    expect(fetch).toHaveBeenCalledWith(PEAPIX_BING_FEED_US, {
      signal: ac.signal,
      credentials: "omit",
      cache: "no-store",
    });
  });

  it("throws on non-OK HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => [],
      }),
    );
    await expect(fetchBingWallpaperImageUrls()).rejects.toThrow("HTTP 503");
  });
});

describe("wallpaperUrlsFromPeapixFeedJson", () => {
  it("prefers fullUrl then imageUrl and skips non-https", () => {
    const urls = wallpaperUrlsFromPeapixFeedJson([
      { fullUrl: "https://img.peapix.com/x_1920.jpg" },
      { imageUrl: "https://img.peapix.com/y.jpg", fullUrl: "" },
      { url: "http://insecure.example/x.jpg" },
      { thumbUrl: "https://img.peapix.com/z_640.jpg" },
    ]);
    expect(urls).toEqual([
      "https://img.peapix.com/x_1920.jpg",
      "https://img.peapix.com/y.jpg",
      "https://img.peapix.com/z_640.jpg",
    ]);
  });

  it("handles invalid input", () => {
    expect(wallpaperUrlsFromPeapixFeedJson(null)).toEqual([]);
    expect(wallpaperUrlsFromPeapixFeedJson({})).toEqual([]);
    expect(wallpaperUrlsFromPeapixFeedJson("nope")).toEqual([]);
  });
});

describe("pickRotatingBingWallpaperUrl", () => {
  it("rotates within the list based on time slot", () => {
    const urls = ["a", "b", "c"];
    expect(pickRotatingBingWallpaperUrl(urls, 0)).toBe("a");
    const fifteenMin = 15 * 60 * 1000;
    expect(pickRotatingBingWallpaperUrl(urls, fifteenMin)).toBe("b");
    expect(pickRotatingBingWallpaperUrl(urls, fifteenMin * 2)).toBe("c");
    expect(pickRotatingBingWallpaperUrl(urls, fifteenMin * 3)).toBe("a");
  });

  it("honors a custom rotation interval in milliseconds", () => {
    const urls = ["a", "b"];
    const thirtyMin = 30 * 60 * 1000;
    expect(pickRotatingBingWallpaperUrl(urls, thirtyMin - 1, thirtyMin)).toBe("a");
    expect(pickRotatingBingWallpaperUrl(urls, thirtyMin, thirtyMin)).toBe("b");
  });

  it("clamps the rotation step to at least one minute", () => {
    const urls = ["a", "b"];
    expect(pickRotatingBingWallpaperUrl(urls, 59_000, 30_000)).toBe("a");
    expect(pickRotatingBingWallpaperUrl(urls, 60_000, 30_000)).toBe("b");
  });
});

describe("pickDailyBingWallpaperUrl", () => {
  it("is stable within a UTC day and advances daily", () => {
    const urls = ["a", "b"];
    const day = 24 * 60 * 60 * 1000;
    expect(pickDailyBingWallpaperUrl(urls, 0)).toBe("a");
    expect(pickDailyBingWallpaperUrl(urls, day - 1)).toBe("a");
    expect(pickDailyBingWallpaperUrl(urls, day)).toBe("b");
    expect(pickDailyBingWallpaperUrl(urls, day * 2 - 1)).toBe("b");
    expect(pickDailyBingWallpaperUrl(urls, day * 2)).toBe("a");
  });
});
