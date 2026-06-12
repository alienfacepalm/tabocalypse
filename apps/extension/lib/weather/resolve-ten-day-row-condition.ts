import type { IWeatherDayForecast, IWeatherSnapshot } from "./fetch-weather";

export interface ITenDayRowCondition {
  /** Icon + primary label (live conditions when `isToday`). */
  code: number;
  summary: string;
  /** Whole-day outlook when it differs from live conditions (today only). */
  dailyOutlookSummary?: string;
}

/**
 * Open-Meteo daily `weather_code` is a whole-day outlook; `current.weather_code` is live.
 * For today's row, prefer live conditions so the icon matches what you see outside.
 */
export function resolveTenDayRowCondition(
  day: IWeatherDayForecast,
  current: IWeatherSnapshot | null,
  isToday: boolean,
): ITenDayRowCondition {
  if (!isToday || !current) {
    return { code: day.code, summary: day.summary };
  }
  const dailyOutlookSummary =
    day.summary !== current.summary && day.code !== current.code ? day.summary : undefined;
  return {
    code: current.code,
    summary: current.summary,
    dailyOutlookSummary,
  };
}

export function formatTenDayRowSummary(condition: ITenDayRowCondition): string {
  if (!condition.dailyOutlookSummary) {
    return condition.summary;
  }
  return `${condition.summary} now · ${condition.dailyOutlookSummary} overall`;
}
