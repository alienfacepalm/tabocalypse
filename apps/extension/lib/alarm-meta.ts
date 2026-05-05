export const ALARM_PREFIX = "tabocalypse:";
export const META_KEY = "alarmMeta";

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
