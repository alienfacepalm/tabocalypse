import browser from "webextension-polyfill";
import { coerceAlarmMetaMessage } from "./alarm-meta-message";
import {
  ALARM_PREFIX,
  isTabocalypseAlarm,
  META_KEY,
  removeAlarmMeta,
  type TAlarmMeta,
} from "./alarm-meta";
import { showTabocalypseAlarmNotification } from "./tabocalypse-alarm-notification";
import type {
  TTabocalypseAlarmDeleteResponse,
  TTabocalypseAlarmScheduleResponse,
} from "./tabocalypse-alarm-message";
import {
  TABOCALYPSE_ALARM_DEFAULT_MESSAGE,
  validateTabocalypseAlarmExistingName,
  validateTabocalypseAlarmWhenMs,
} from "./tabocalypse-alarm-validation";

export interface ITabocalypsePendingAlarm {
  name: string;
  scheduledTime: number;
  message: string;
}

export interface IScheduleTabocalypseAlarmInput {
  whenMs: number;
  message: string;
  existingName?: string | null;
}

async function readAlarmMeta(): Promise<TAlarmMeta> {
  const r = await browser.storage.local.get(META_KEY);
  return ((r[META_KEY] as TAlarmMeta) ?? {}) as TAlarmMeta;
}

export async function listTabocalypseAlarms(): Promise<ITabocalypsePendingAlarm[]> {
  const alarms = await browser.alarms.getAll();
  const meta = await readAlarmMeta();
  return alarms
    .filter((a) => isTabocalypseAlarm(a.name))
    .map((a) => ({
      name: a.name,
      scheduledTime: a.scheduledTime,
      message: coerceAlarmMetaMessage(meta[a.name]) || TABOCALYPSE_ALARM_DEFAULT_MESSAGE,
    }))
    .sort((a, b) => a.scheduledTime - b.scheduledTime);
}

export async function scheduleTabocalypseAlarm(
  input: IScheduleTabocalypseAlarmInput,
): Promise<TTabocalypseAlarmScheduleResponse> {
  const whenError = validateTabocalypseAlarmWhenMs(input.whenMs);
  if (whenError) return { ok: false, error: whenError };

  const isEdit = Boolean(input.existingName);
  const existingNameError = validateTabocalypseAlarmExistingName(input.existingName);
  if (existingNameError) return { ok: false, error: existingNameError };

  try {
    if (isEdit && input.existingName) {
      await browser.alarms.clear(input.existingName);
    }
    const name =
      isEdit && input.existingName ? input.existingName : `${ALARM_PREFIX}${crypto.randomUUID()}`;
    const meta = await readAlarmMeta();
    const message = input.message.trim() || TABOCALYPSE_ALARM_DEFAULT_MESSAGE;
    await browser.storage.local.set({
      [META_KEY]: { ...meta, [name]: message },
    });
    await browser.alarms.create(name, { when: input.whenMs });
    return { ok: true, name };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not schedule the notification.",
    };
  }
}

export async function deleteTabocalypseAlarm(
  name: string,
): Promise<TTabocalypseAlarmDeleteResponse> {
  if (!isTabocalypseAlarm(name)) {
    return { ok: false, error: "That alarm could not be removed." };
  }
  try {
    await browser.alarms.clear(name);
    const meta = await readAlarmMeta();
    await browser.storage.local.set({ [META_KEY]: removeAlarmMeta(meta, name) });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not delete the alarm.",
    };
  }
}

/** Called from the MV3 service worker when `browser.alarms.onAlarm` fires. */
export async function handleTabocalypseAlarmFired(alarmName: string): Promise<void> {
  if (!isTabocalypseAlarm(alarmName)) return;
  const meta = await readAlarmMeta();
  const message = meta[alarmName];
  await browser.storage.local.set({ [META_KEY]: removeAlarmMeta(meta, alarmName) });
  const notified = await showTabocalypseAlarmNotification(alarmName, message);
  if (!notified.ok) {
    console.error("[Tabocalypse] alarm fired but notification failed:", notified.error);
  }
}
