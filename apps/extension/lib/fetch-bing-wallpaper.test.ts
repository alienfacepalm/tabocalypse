import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BING_HP_ARCHIVE,
  fetchBingWallpaperImageUrls,
  pickDailyBingWallpaperUrl,
  pickRotatingBingWallpaperUrl,
  wallpaperUrlsFromBingArchiveJson,
} from "./fetch-bing-wallpaper";

describe("fetchBingWallpaperImageUrls", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ images: [{ url: "/th?id=OHR.X_1920x1080.jpg" }] }),
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches Bing HPImageArchive and returns absolute image URLs", async () => {
    const urls = await fetchBingWallpaperImageUrls();
    expect(urls).toEqual(["https://www.bing.com/th?id=OHR.X_1920x1080.jpg"]);
    expect(fetch).toHaveBeenCalledWith(BING_HP_ARCHIVE, { signal: undefined });
  });

  it("passes AbortSignal to fetch", async () => {
    const ac = new AbortController();
    await fetchBingWallpaperImageUrls(ac.signal);
    expect(fetch).toHaveBeenCalledWith(BING_HP_ARCHIVE, { signal: ac.signal });
  });

  it("throws on non-OK HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      }),
    );
    await expect(fetchBingWallpaperImageUrls()).rejects.toThrow("Bing wallpaper HTTP 503");
  });
});

describe("wallpaperUrlsFromBingArchiveJson", () => {
  it("returns absolute https URLs from Bing-style payload", () => {
    const urls = wallpaperUrlsFromBingArchiveJson({
      images: [
        { url: "/th?id=OHR.Test_EN-US123_1920x1080.jpg" },
        { url: "https://example.com/a.jpg" },
      ],
    });
    expect(urls).toEqual([
      "https://www.bing.com/th?id=OHR.Test_EN-US123_1920x1080.jpg",
      "https://example.com/a.jpg",
    ]);
  });

  it("handles invalid input", () => {
    expect(wallpaperUrlsFromBingArchiveJson(null)).toEqual([]);
    expect(wallpaperUrlsFromBingArchiveJson({})).toEqual([]);
    expect(wallpaperUrlsFromBingArchiveJson({ images: "nope" })).toEqual([]);
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
