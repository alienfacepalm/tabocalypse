import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { storage: {} },
}));

const { pickCryptoSnark } = await import("./crypto-snark");

describe("pickCryptoSnark", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when humor is disabled or intensity is off", () => {
    expect(
      pickCryptoSnark({
        humorEnabled: false,
        humorIntensity: "spicy",
        chartDays: 1,
        primaryChangePct: 2,
        secondaryChangePct: 2,
        locale: "en-US",
      }),
    ).toBeNull();
    expect(
      pickCryptoSnark({
        humorEnabled: true,
        humorIntensity: "off",
        chartDays: 1,
        primaryChangePct: 2,
        secondaryChangePct: 2,
        locale: "en-US",
      }),
    ).toBeNull();
  });

  it("returns snark for spicy when humor is enabled", () => {
    const line = pickCryptoSnark({
      humorEnabled: true,
      humorIntensity: "spicy",
      chartDays: 30,
      primaryChangePct: 2,
      secondaryChangePct: 2,
      locale: "en-US",
    });
    expect(line).toBeTruthy();
    expect(line!.length).toBeGreaterThan(12);
  });

  it("handles mixed directional moves", () => {
    const line = pickCryptoSnark({
      humorEnabled: true,
      humorIntensity: "mild",
      chartDays: 7,
      primaryChangePct: 4,
      secondaryChangePct: -4,
      locale: "en-US",
    });
    expect(line).toBeTruthy();
  });
});
