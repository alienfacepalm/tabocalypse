/** Local calendar date as `YYYY-MM-DD` (local getters, not UTC). */
export function isoDateLocal(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Previous local calendar date; anchored at noon so DST shifts cannot skip a day. */
export function previousIsoDateLocal(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return isoDateLocal(date);
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDateString(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE_RE.test(value);
}

/**
 * Days since 1970-01-01 for a calendar date, independent of the local time zone.
 * Consecutive calendar days always differ by exactly 1 (no DST drift). Malformed input → 0.
 */
export function isoDateToDayNumber(isoDate: string): number {
  const match = ISO_DATE_RE.exec(isoDate);
  if (!match) return 0;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const ms = Date.UTC(y, m - 1, d);
  if (!Number.isFinite(ms)) return 0;
  return Math.floor(ms / 86_400_000);
}

/** Milliseconds until the next local midnight (always at least 1). */
export function msUntilNextLocalMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(1, next.getTime() - now.getTime());
}
