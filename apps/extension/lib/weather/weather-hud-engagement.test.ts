import { describe, expect, it } from "vitest";
import { applyWeatherHudDailyCheckIn } from "./weather-hud-engagement-logic";

describe("applyWeatherHudDailyCheckIn", () => {
  it("starts a streak on first visit", () => {
    expect(applyWeatherHudDailyCheckIn(null, "2026-06-11")).toEqual({
      lastCheckInDate: "2026-06-11",
      streakDays: 1,
      totalPoints: 10,
    });
  });

  it("extends the streak on consecutive days", () => {
    expect(
      applyWeatherHudDailyCheckIn(
        { lastCheckInDate: "2026-06-10", streakDays: 2, totalPoints: 20 },
        "2026-06-11",
      ),
    ).toEqual({
      lastCheckInDate: "2026-06-11",
      streakDays: 3,
      totalPoints: 30,
    });
  });

  it("does not double-award the same day", () => {
    const prev = { lastCheckInDate: "2026-06-11", streakDays: 1, totalPoints: 10 };
    expect(applyWeatherHudDailyCheckIn(prev, "2026-06-11")).toBe(prev);
  });
});
