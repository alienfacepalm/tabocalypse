export const TABOCALYPSE_ALARM_SCHEDULE = "tabocalypse/alarmSchedule" as const;
export const TABOCALYPSE_ALARM_DELETE = "tabocalypse/alarmDelete" as const;
export const TABOCALYPSE_ALARM_TEST_NOTIFICATION = "tabocalypse/alarmTestNotification" as const;

export type TTabocalypseAlarmScheduleRequest = {
  type: typeof TABOCALYPSE_ALARM_SCHEDULE;
  whenMs: number;
  message: string;
  existingName?: string | null;
};

export type TTabocalypseAlarmScheduleOk = {
  ok: true;
  name: string;
};

export type TTabocalypseAlarmScheduleErr = {
  ok: false;
  error: string;
};

export type TTabocalypseAlarmScheduleResponse =
  | TTabocalypseAlarmScheduleOk
  | TTabocalypseAlarmScheduleErr;

export type TTabocalypseAlarmDeleteRequest = {
  type: typeof TABOCALYPSE_ALARM_DELETE;
  name: string;
};

export type TTabocalypseAlarmDeleteOk = {
  ok: true;
};

export type TTabocalypseAlarmDeleteErr = {
  ok: false;
  error: string;
};

export type TTabocalypseAlarmDeleteResponse =
  | TTabocalypseAlarmDeleteOk
  | TTabocalypseAlarmDeleteErr;

export type TTabocalypseAlarmTestNotificationRequest = {
  type: typeof TABOCALYPSE_ALARM_TEST_NOTIFICATION;
};

export type TTabocalypseAlarmTestNotificationOk = {
  ok: true;
};

export type TTabocalypseAlarmTestNotificationErr = {
  ok: false;
  error: string;
};

export type TTabocalypseAlarmTestNotificationResponse =
  | TTabocalypseAlarmTestNotificationOk
  | TTabocalypseAlarmTestNotificationErr;
