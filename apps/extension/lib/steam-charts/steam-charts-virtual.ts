/** Fixed row height for Steam leaderboard virtualization (capsule + gap). */
export const STEAM_CHARTS_ROW_HEIGHT_PX = 40;

/** steamcharts.com /top table page size. */
export const STEAM_CHARTS_TOP_PAGE_SIZE = 25;

/** Absolute ceiling for infinite-scroll open charts (multiple /top pages). */
export const STEAM_CHARTS_OPEN_ABSOLUTE_MAX = 200;

export { rowsThatFitViewport } from "../hud-virtual-window";

export function steamChartsTopPageUrl(page: number): string {
  const p = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  if (p <= 1) return "https://steamcharts.com/top";
  return `https://steamcharts.com/top/p.${p}`;
}
