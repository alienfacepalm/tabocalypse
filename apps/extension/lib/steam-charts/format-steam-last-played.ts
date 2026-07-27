/**
 * Short last-played labels for Steam Recently played rows.
 * Same calendar year → `Mar 12`; other years → `Mar 12 '24`.
 */
export function formatSteamLastPlayedShort(
  lastPlayedAtSec: number | null | undefined,
  locale: string,
  now: Date = new Date(),
): string | null {
  if (typeof lastPlayedAtSec !== "number" || !Number.isFinite(lastPlayedAtSec)) return null;
  const sec = Math.floor(lastPlayedAtSec);
  if (sec <= 0) return null;
  const played = new Date(sec * 1000);
  if (Number.isNaN(played.getTime())) return null;

  const sameYear = played.getFullYear() === now.getFullYear();
  return played.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "2-digit" }),
  });
}
