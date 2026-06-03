import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import { peapixBingFeedUrl } from "./bing-wallpaper-country";
import {
  bingWallpaperCaptionFromEntry,
  bingWallpaperEntriesFromPeapixFeedJson,
  fetchBingWallpaperFeed,
  pickDailyBingWallpaperEntry,
  pickRotatingBingWallpaperEntry,
} from "./fetch-bing-wallpaper";

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

  it("fetches Peapix Bing feed for the requested country", async () => {
    const entries = await fetchBingWallpaperFeed("us");
    expect(entries.map((e) => e.imageUrl)).toEqual(["https://img.peapix.com/a_1920.jpg"]);
    expect(fetch).toHaveBeenCalledWith(peapixBingFeedUrl("us"), {
      signal: undefined,
      credentials: "omit",
      cache: "no-store",
    });
  });

  it("passes AbortSignal to fetch", async () => {
    const ac = new AbortController();
    await fetchBingWallpaperFeed("us", ac.signal);
    expect(fetch).toHaveBeenCalledWith(peapixBingFeedUrl("us"), {
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
    await expect(fetchBingWallpaperFeed("us")).rejects.toThrow("HTTP 503");
  });
});

describe("pickRotatingBingWallpaperEntry", () => {
  const entries = [
    { imageUrl: "a", title: "A", copyright: "" },
    { imageUrl: "b", title: "B", copyright: "" },
    { imageUrl: "c", title: "C", copyright: "" },
  ];

  it("rotates within the list based on time slot", () => {
    expect(pickRotatingBingWallpaperEntry(entries, 0).imageUrl).toBe("a");
    const fifteenMin = 15 * 60 * 1000;
    expect(pickRotatingBingWallpaperEntry(entries, fifteenMin).imageUrl).toBe("b");
    expect(pickRotatingBingWallpaperEntry(entries, fifteenMin * 2).imageUrl).toBe("c");
    expect(pickRotatingBingWallpaperEntry(entries, fifteenMin * 3).imageUrl).toBe("a");
  });

  it("honors a custom rotation interval in milliseconds", () => {
    const pair = entries.slice(0, 2);
    const thirtyMin = 30 * 60 * 1000;
    expect(pickRotatingBingWallpaperEntry(pair, thirtyMin - 1, thirtyMin).imageUrl).toBe("a");
    expect(pickRotatingBingWallpaperEntry(pair, thirtyMin, thirtyMin).imageUrl).toBe("b");
  });

  it("clamps the rotation step to at least one minute", () => {
    const pair = entries.slice(0, 2);
    expect(pickRotatingBingWallpaperEntry(pair, 59_000, 30_000).imageUrl).toBe("a");
    expect(pickRotatingBingWallpaperEntry(pair, 60_000, 30_000).imageUrl).toBe("b");
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
    expect(pickDailyBingWallpaperEntry(entries, day - 1).imageUrl).toBe("a");
    expect(pickDailyBingWallpaperEntry(entries, day).imageUrl).toBe("b");
    expect(pickDailyBingWallpaperEntry(entries, day * 2 - 1).imageUrl).toBe("b");
    expect(pickDailyBingWallpaperEntry(entries, day * 2).imageUrl).toBe("a");
  });
});
