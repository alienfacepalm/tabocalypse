import browser from "webextension-polyfill";
import {
  applyWeatherHudDailyCheckIn,
  weatherHudEngagementIsoDateLocal,
  type IWeatherHudEngagement,
} from "./weather-hud-engagement-logic";

export type { IWeatherHudEngagement } from "./weather-hud-engagement-logic";
export { applyWeatherHudDailyCheckIn } from "./weather-hud-engagement-logic";

const STORAGE_KEY = "tabocalypseWeatherHudEngagement";

export async function loadWeatherHudEngagement(): Promise<IWeatherHudEngagement | null> {
  const raw = await browser.storage.local.get(STORAGE_KEY);
  const row = raw[STORAGE_KEY];
  if (!row || typeof row !== "object") return null;
  const value = row as Partial<IWeatherHudEngagement>;
  if (
    typeof value.lastCheckInDate !== "string" ||
    typeof value.streakDays !== "number" ||
    typeof value.totalPoints !== "number"
  ) {
    return null;
  }
  return {
    lastCheckInDate: value.lastCheckInDate,
    streakDays: value.streakDays,
    totalPoints: value.totalPoints,
  };
}

export async function recordWeatherHudDailyCheckIn(
  now = new Date(),
): Promise<IWeatherHudEngagement> {
  const todayIso = weatherHudEngagementIsoDateLocal(now);
  const prev = await loadWeatherHudEngagement();
  const next = applyWeatherHudDailyCheckIn(prev, todayIso);
  if (next === prev) {
    return next;
  }
  await browser.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}
