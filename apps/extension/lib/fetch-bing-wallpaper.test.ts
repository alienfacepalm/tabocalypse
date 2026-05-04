import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockBrowser, sendMessage } = vi.hoisted(() => {
  const sendMessage = vi.fn();
  const mockBrowser = {
    runtime: { sendMessage },
  };
  return { mockBrowser, sendMessage };
});

vi.mock("webextension-polyfill", () => ({
  default: mockBrowser,
}));

import {
  fetchBingWallpaperImageUrls,
  pickDailyBingWallpaperUrl,
  pickRotatingBingWallpaperUrl,
  TABOCALYPSE_BING_WALLPAPER_URLS_MESSAGE,
  wallpaperUrlsFromBingArchiveJson,
} from "./fetch-bing-wallpaper";

describe("fetchBingWallpaperImageUrls", () => {
  beforeEach(() => {
    sendMessage.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("proxies through runtime.sendMessage", async () => {
    sendMessage.mockResolvedValue({ ok: true, urls: ["a"] });
    const urls = await fetchBingWallpaperImageUrls();
    expect(urls).toEqual(["a"]);
    expect(sendMessage).toHaveBeenCalledWith({ type: TABOCALYPSE_BING_WALLPAPER_URLS_MESSAGE });
  });

  it("throws on error responses", async () => {
    sendMessage.mockResolvedValue({ ok: false, error: "nope" });
    await expect(fetchBingWallpaperImageUrls()).rejects.toThrow("nope");
  });

  it("throws when the background worker does not respond", async () => {
    sendMessage.mockResolvedValue(undefined);
    await expect(fetchBingWallpaperImageUrls()).rejects.toThrow(
      "No response from background worker for Bing wallpaper URLs.",
    );
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
