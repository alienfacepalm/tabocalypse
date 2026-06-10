import { isTabocalypseAlarm } from "./alarm-meta";

export const TABOCALYPSE_ALARM_DEFAULT_MESSAGE = "Tabocalypse alarm";

/** Returns a user-facing error string, or `null` when `whenMs` is valid. */
export function validateTabocalypseAlarmWhenMs(
  whenMs: number,
  nowMs: number = Date.now(),
): string | null {
  if (Number.isNaN(whenMs)) return "That date and time is not valid.";
  if (whenMs < nowMs) return "Pick a time in the future.";
  return null;
}

/** Returns a user-facing error when an edit target is not a Tabocalypse alarm. */
export function validateTabocalypseAlarmExistingName(
  existingName: string | null | undefined,
): string | null {
  if (!existingName) return null;
  return isTabocalypseAlarm(existingName) ? null : "That alarm could not be updated.";
}
