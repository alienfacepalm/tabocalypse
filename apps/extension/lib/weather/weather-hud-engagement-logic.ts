import { isoDateLocal, previousIsoDateLocal } from "../local-iso-date";

export interface IWeatherHudEngagement {
  lastCheckInDate: string;
  streakDays: number;
  totalPoints: number;
}

/** Pure check-in logic for tests. Awards 10 points per new local day. */
export function applyWeatherHudDailyCheckIn(
  prev: IWeatherHudEngagement | null,
  todayIso: string,
  pointsPerDay = 10,
): IWeatherHudEngagement {
  if (prev?.lastCheckInDate === todayIso) {
    return prev;
  }
  const continued = prev?.lastCheckInDate === previousIsoDateLocal(todayIso);
  const streakDays = continued ? prev.streakDays + 1 : 1;
  return {
    lastCheckInDate: todayIso,
    streakDays,
    totalPoints: (prev?.totalPoints ?? 0) + pointsPerDay,
  };
}

export { isoDateLocal as weatherHudEngagementIsoDateLocal };
