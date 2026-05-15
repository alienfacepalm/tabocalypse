/** CoinGecko `market_chart` `days` parameter values surfaced in the Crypto widget. */
export const CRYPTO_CHART_DAY_OPTIONS = [1, 7, 30, 90, 365] as const;

export type TCryptoChartDays = (typeof CRYPTO_CHART_DAY_OPTIONS)[number];

const OPTION_SET: ReadonlySet<number> = new Set(CRYPTO_CHART_DAY_OPTIONS);

export function coerceCryptoChartDays(raw: unknown, fallback: TCryptoChartDays): TCryptoChartDays {
  if (typeof raw === "number" && OPTION_SET.has(raw)) return raw as TCryptoChartDays;
  return fallback;
}

export function cryptoChartRangeShortLabel(days: TCryptoChartDays): string {
  switch (days) {
    case 1:
      return "24H";
    case 7:
      return "7D";
    case 30:
      return "30D";
    case 90:
      return "90D";
    case 365:
      return "1Y";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

export function cryptoChartRangeTip(days: TCryptoChartDays): string {
  switch (days) {
    case 1:
      return "Sparkline uses the last 24 hours";
    case 7:
      return "Sparkline uses the last 7 days";
    case 30:
      return "Sparkline uses the last 30 days";
    case 90:
      return "Sparkline uses the last 90 days";
    case 365:
      return "Sparkline uses the last year";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}
