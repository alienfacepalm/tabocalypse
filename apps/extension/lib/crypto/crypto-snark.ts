import { timeBucketSeed } from "../humor/engine";
import type { THumorIntensity } from "../settings";
import type { TCryptoChartDays } from "./crypto-chart-days";

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type TMix = "up" | "down" | "flat" | "mixed";

function classifyMix(btc: number, eth: number): TMix {
  const hi = Math.max(btc, eth);
  const lo = Math.min(btc, eth);
  if (hi > 0.35 && lo < -0.35) return "mixed";
  const avg = (btc + eth) / 2;
  if (avg > 0.5) return "up";
  if (avg < -0.5) return "down";
  return "flat";
}

const LINES: Record<
  THumorIntensity,
  Record<TMix, readonly string[]> & { range365: readonly string[] }
> = {
  off: { up: [], down: [], flat: [], mixed: [], range365: [] },
  mild: {
    up: [
      "Green ticks. Treat yourself to closing a tab you opened “for later.”",
      "Upward wiggle in this window. Please do not DM your accountant screenshots.",
    ],
    down: [
      "Down a bit on this range. At least your new tab still loads.",
      "Red numbers, calm breathing. It is still just lines on a chart.",
    ],
    flat: [
      "Sideways chart, sideways mood — honest work.",
      "Flat like your excuse for sixty-four open tabs.",
    ],
    mixed: [
      "BTC and ETH disagree; pick a personality and commit.",
      "One coin pumped, one sulked. Classic siblings energy.",
    ],
    range365: [
      "Year view: zoomed out enough to pretend you have perspective.",
      "Annual mode. Long enough to forget what you were mad about in January.",
    ],
  },
  spicy: {
    up: [
      "Number go up. The universe briefly tolerates joy.",
      "Green enough to screenshot and pretend it was skill.",
    ],
    down: [
      "Line ate pavement. Maybe the chart needed the exercise.",
      "Red carpet rollout for your risk tolerance.",
    ],
    flat: [
      "This graph has main-character syndrome but zero plot.",
      "Flatline chic: maximum suspense, minimum payoff.",
    ],
    mixed: [
      "Split decision: your portfolio cosplays as a divorce proceeding.",
      "One mooned, one napped. Neither asked your opinion.",
    ],
    range365: [
      "A whole year of coping in one squiggle. Impressive density.",
      "365-day lore drop: mostly vibes, some volatility, zero refunds.",
    ],
  },
  unhinged: {
    up: [
      "UP ONLY (for this window) (don’t tell past-you) (they’re still mad).",
      "Chart green; dopamine budget already overdrawn.",
    ],
    down: [
      "If vibes were collateral, you’d be margin-called by a loading spinner.",
      "Down bad? Your tab bar already was. This is just synchronized chaos.",
    ],
    flat: [
      "Flat chart energy: toast with no butter, song with no drop.",
      "Sidequest unlocked: entertain yourself without a slope.",
    ],
    mixed: [
      "ETH and BTC picked different anime arcs and you’re extras in both.",
      "One coin ran, one coin sulked — peak dysfunctional household.",
    ],
    range365: [
      "Annual trauma snapshot, now with sparkles and extra JPEG.",
      "One year of regret compressed to a SVG — modern art, honestly.",
    ],
  },
};

export function pickCryptoSnark(input: {
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  chartDays: TCryptoChartDays;
  primaryChangePct: number;
  secondaryChangePct: number;
  locale: string;
}): string | null {
  if (!input.humorEnabled || input.humorIntensity === "off") return null;
  const pool = LINES[input.humorIntensity];
  const mix = classifyMix(input.primaryChangePct, input.secondaryChangePct);
  const lines = input.chartDays === 365 ? [...pool[mix], ...pool.range365] : [...pool[mix]];
  if (lines.length === 0) return null;
  const idx =
    hashString(
      `${timeBucketSeed(7)}|${input.locale}|${mix}|${input.chartDays}|${lines.length}|${input.primaryChangePct.toFixed(2)}|${input.secondaryChangePct.toFixed(2)}`,
    ) % lines.length;
  return lines[idx] ?? null;
}
