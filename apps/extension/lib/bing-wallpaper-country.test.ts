import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  coercePeapixBingCountry,
  inferPeapixBingCountryFromNavigator,
  peapixBingFeedUrl,
  resolveEffectivePeapixBingCountry,
} from "./bing-wallpaper-country";

describe("peapixBingFeedUrl", () => {
  it("builds the Peapix feed URL for a country code", () => {
    expect(peapixBingFeedUrl("de")).toBe("https://peapix.com/bing/feed?country=de");
  });
});

describe("coercePeapixBingCountry", () => {
  it("accepts known codes and falls back otherwise", () => {
    expect(coercePeapixBingCountry("uk", "us")).toBe("uk");
    expect(coercePeapixBingCountry("ZZ", "us")).toBe("us");
  });
});

describe("inferPeapixBingCountryFromNavigator", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps de-DE to de", () => {
    vi.stubGlobal("navigator", { language: "de-DE" });
    expect(inferPeapixBingCountryFromNavigator()).toBe("de");
  });

  it("falls back to us for unknown regions", () => {
    vi.stubGlobal("navigator", { language: "xx-YY" });
    expect(inferPeapixBingCountryFromNavigator()).toBe("us");
  });
});

describe("resolveEffectivePeapixBingCountry", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { language: "en-GB" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses locale when auto is on", () => {
    expect(
      resolveEffectivePeapixBingCountry({
        bingWallpaperCountryAuto: true,
        bingWallpaperCountry: "us",
      }),
    ).toBe("uk");
  });

  it("uses the fixed country when auto is off", () => {
    expect(
      resolveEffectivePeapixBingCountry({
        bingWallpaperCountryAuto: false,
        bingWallpaperCountry: "jp",
      }),
    ).toBe("jp");
  });
});
