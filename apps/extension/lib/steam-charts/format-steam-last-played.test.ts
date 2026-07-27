import { describe, expect, it } from "vitest";
import { formatSteamLastPlayedShort } from "./format-steam-last-played";

describe("formatSteamLastPlayedShort", () => {
  const now = new Date("2026-07-27T12:00:00Z");

  it("returns null for missing or zero timestamps", () => {
    expect(formatSteamLastPlayedShort(null, "en-US", now)).toBeNull();
    expect(formatSteamLastPlayedShort(undefined, "en-US", now)).toBeNull();
    expect(formatSteamLastPlayedShort(0, "en-US", now)).toBeNull();
  });

  it("uses month+day in the same year", () => {
    // 2026-03-12 local — use UTC noon to avoid TZ edge
    const sec = Math.floor(Date.UTC(2026, 2, 12, 12, 0, 0) / 1000);
    const label = formatSteamLastPlayedShort(sec, "en-US", now);
    expect(label).toMatch(/Mar/);
    expect(label).toMatch(/12/);
    expect(label).not.toMatch(/26|2026/);
  });

  it("includes a short year when not the current year", () => {
    const sec = Math.floor(Date.UTC(2024, 10, 5, 12, 0, 0) / 1000);
    const label = formatSteamLastPlayedShort(sec, "en-US", now);
    expect(label).toMatch(/Nov/);
    expect(label).toMatch(/5/);
    expect(label).toMatch(/24/);
  });
});
