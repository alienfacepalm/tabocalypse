import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import {
  PEAPIX_BING_FEED_US,
  bingWallpaperCaptionFromEntry,
  bingWallpaperEntriesFromPeapixFeedJson,
  fetchBingWallpaperFeed,
  fetchBingWallpaperImageUrls,
  pickDailyBingWallpaperEntry,
  pickDailyBingWallpaperUrl,
  pickRotatingBingWallpaperEntry,
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
    const urls = await fetchBingWallpaperImageUrls("us");
    expect(urls).toEqual(["https://img.peapix.com/a_1920.jpg"]);
    expect(fetch).toHaveBeenCalledWith(PEAPIX_BING_FEED_US, {
      signal: undefined,
      credentials: "omit",
      cache: "no-store",
    });
  });

  it("passes AbortSignal to fetch", async () => {
    const ac = new AbortController();
    await fetchBingWallpaperImageUrls("us", ac.signal);
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
    await expect(fetchBingWallpaperImageUrls("us")).rejects.toThrow("HTTP 503");
  });
});

describe("bingWallpaperEntriesFromPeapixFeedJson", () => {
  it("prefers fullUrl then imageUrl and skips non-https", () => {
    const entries = bingWallpaperEntriesFromPeapixFeedJson([
      {
        fullUrl: "https://img.peapix.com/x_1920.jpg",
        title: "Everglades",
        copyright: "© Example",
      },
      { imageUrl: "https://img.peapix.com/y.jpg", fullUrl: "" },
      { url: "http://insecure.example/x.jpg" },
      { thumbUrl: "https://img.peapix.com/z_640.jpg" },
    ]);
    expect(entries.map((e) => e.imageUrl)).toEqual([
      "https://img.peapix.com/x_1920.jpg",
      "https://img.peapix.com/y.jpg",
      "https://img.peapix.com/z_640.jpg",
    ]);
    expect(entries[0]?.title).toBe("Everglades");
    expect(entries[0]?.copyright).toBe("© Example");
  });

  it("handles invalid input", () => {
    expect(bingWallpaperEntriesFromPeapixFeedJson(null)).toEqual([]);
    expect(bingWallpaperEntriesFromPeapixFeedJson({})).toEqual([]);
    expect(bingWallpaperEntriesFromPeapixFeedJson("nope")).toEqual([]);
  });
});

describe("wallpaperUrlsFromPeapixFeedJson", () => {
  it("returns image URLs from entries", () => {
    const urls = wallpaperUrlsFromPeapixFeedJson([
      { fullUrl: "https://img.peapix.com/x_1920.jpg" },
      { imageUrl: "https://img.peapix.com/y.jpg", fullUrl: "" },
    ]);
    expect(urls).toEqual(["https://img.peapix.com/x_1920.jpg", "https://img.peapix.com/y.jpg"]);
  });
});

describe("bingWallpaperCaptionFromEntry", () => {
  it("prefers title over copyright", () => {
    expect(
      bingWallpaperCaptionFromEntry({
        imageUrl: "https://img.peapix.com/a.jpg",
        title: "Mount Everest, Nepal",
        copyright: "© Photographer",
      }),
    ).toBe("Mount Everest, Nepal");
  });

  it("falls back to copyright when title is empty", () => {
    expect(
      bingWallpaperCaptionFromEntry({
        imageUrl: "https://img.peapix.com/a.jpg",
        title: "",
        copyright: "© Photographer",
      }),
    ).toBe("© Photographer");
  });
});

describe("fetchBingWallpaperFeed", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            title: "Sea otter, Alaska",
            fullUrl: "https://img.peapix.com/a_1920.jpg",
          },
        ],
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns feed entries with captions", async () => {
    const entries = await fetchBingWallpaperFeed("de");
    expect(fetch).toHaveBeenCalledWith("https://peapix.com/bing/feed?country=de", {
      signal: undefined,
      credentials: "omit",
      cache: "no-store",
    });
    expect(entries).toEqual([
      {
        imageUrl: "https://img.peapix.com/a_1920.jpg",
        title: "Sea otter, Alaska",
        copyright: "",
      },
    ]);
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

describe("pickRotatingBingWallpaperEntry", () => {
  it("rotates entries with the same slot logic as URLs", () => {
    const entries = [
      { imageUrl: "a", title: "A", copyright: "" },
      { imageUrl: "b", title: "B", copyright: "" },
    ];
    const fifteenMin = 15 * 60 * 1000;
    expect(pickRotatingBingWallpaperEntry(entries, 0).imageUrl).toBe("a");
    expect(pickRotatingBingWallpaperEntry(entries, fifteenMin).title).toBe("B");
  });
});

describe("pickDailyBingWallpaperEntry", () => {
  it("is stable within a UTC day and advances daily", () => {
    const entries = [
      { imageUrl: "a", title: "A", copyright: "" },
      { imageUrl: "b", title: "B", copyright: "" },
    ];
    const day = 24 * 60 * 60 * 1000;
    expect(pickDailyBingWallpaperEntry(entries, 0).imageUrl).toBe("a");
    expect(pickDailyBingWallpaperEntry(entries, day).imageUrl).toBe("b");
  });
});
