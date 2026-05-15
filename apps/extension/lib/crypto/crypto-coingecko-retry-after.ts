/**
 * Parse CoinGecko / CDN-style Retry-After (seconds as decimal integer string).
 */
export function parseRetryAfterDelayMs(headerValue: string | null): number | undefined {
  if (headerValue == null || headerValue.trim() === "") return undefined;
  const asInt = Number.parseInt(headerValue.trim(), 10);
  if (!Number.isFinite(asInt) || asInt < 0) return undefined;
  return asInt * 1000;
}
