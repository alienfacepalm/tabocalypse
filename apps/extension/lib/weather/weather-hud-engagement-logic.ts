export interface IWeatherHudEngagement {
  lastCheckInDate: string;
  streakDays: number;
  totalPoints: number;
}

function isoDateLocal(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function previousIsoDateLocal(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return isoDateLocal(date);
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
