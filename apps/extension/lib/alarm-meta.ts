export const ALARM_PREFIX = "tabocalypse:";
export const META_KEY = "alarmMeta";

/** Extension icon path used for OS notification chrome (see WXT `icons/` output). */
export const TABOCALYPSE_ALARM_NOTIFICATION_ICON = "icons/128.png";

/** Chrome notification ids must be stable strings; alarm names include `:` from UUIDs. */
export function tabocalypseAlarmNotificationId(alarmName: string): string {
  const safe = alarmName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `tabocalypse-${safe}`;
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
