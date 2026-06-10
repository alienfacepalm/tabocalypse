export const ALARM_PREFIX = "tabocalypse:";
export const META_KEY = "alarmMeta";

/** Extension icon path used for OS notification chrome (see WXT `icons/` output). */
export const TABOCALYPSE_ALARM_NOTIFICATION_ICON = "icons/128.png";

/** Root-level icon copied to `public/` for Chromium MV3 service worker notifications. */
export const TABOCALYPSE_NOTIFICATION_ICON_ROOT = "notification-icon.png";

/** Packaged icon paths to try when the primary notification icon fails to load. */
export const TABOCALYPSE_NOTIFICATION_ICON_CANDIDATES = [
  TABOCALYPSE_NOTIFICATION_ICON_ROOT,
  TABOCALYPSE_ALARM_NOTIFICATION_ICON,
  "icon/128.png",
  "icons/48.png",
  "icons/32.png",
] as const;

export type TTabocalypseNotificationIconCandidate =
  (typeof TABOCALYPSE_NOTIFICATION_ICON_CANDIDATES)[number];

/** Chrome notification ids must be stable strings; alarm names include `:` from UUIDs. */
export function tabocalypseAlarmNotificationId(alarmName: string): string {
  const safe = alarmName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `tabocalypse-${safe}`;
}

/** Fresh id for test notifications so Windows shows a new toast each click. */
export function tabocalypseTestNotificationId(nowMs: number = Date.now()): string {
  return `tabocalypse-test-${nowMs}`;
}

export type TAlarmMeta = Record<string, string>;

/** Returns true when a raw alarm name belongs to Tabocalypse. */
export function isTabocalypseAlarm(name: string): boolean {
  return name.startsWith(ALARM_PREFIX);
}

/** Build the cleaned metadata after a fired alarm removes its entry. */
export function removeAlarmMeta(meta: TAlarmMeta, alarmName: string): TAlarmMeta {
  const { [alarmName]: _, ...rest } = meta;
  return rest;
}
