import browser from "webextension-polyfill";
import type { IScheduleTabocalypseAlarmInput } from "./tabocalypse-alarm-service";
import {
  TABOCALYPSE_ALARM_DELETE,
  TABOCALYPSE_ALARM_SCHEDULE,
  TABOCALYPSE_ALARM_TEST_NOTIFICATION,
  type TTabocalypseAlarmDeleteResponse,
  type TTabocalypseAlarmScheduleResponse,
  type TTabocalypseAlarmTestNotificationResponse,
} from "./tabocalypse-alarm-message";

const BACKGROUND_NO_RESPONSE = "Tabocalypse background did not respond.";

function isScheduleResponse(value: unknown): value is TTabocalypseAlarmScheduleResponse {
  return (
    value != null &&
    typeof value === "object" &&
    "ok" in value &&
    typeof (value as { ok: unknown }).ok === "boolean"
  );
}

function isDeleteResponse(value: unknown): value is TTabocalypseAlarmDeleteResponse {
  return isScheduleResponse(value);
}

/**
 * Schedule or update an alarm via the extension service worker.
 * Alarms are tracked by `browser.alarms` in the background — the new tab does not need to stay open.
 */
export async function scheduleTabocalypseAlarmViaBackground(
  input: IScheduleTabocalypseAlarmInput,
): Promise<TTabocalypseAlarmScheduleResponse> {
  const response = await browser.runtime.sendMessage({
    type: TABOCALYPSE_ALARM_SCHEDULE,
    whenMs: input.whenMs,
    message: input.message,
    existingName: input.existingName ?? null,
  });
  if (!isScheduleResponse(response)) {
    return { ok: false, error: BACKGROUND_NO_RESPONSE };
  }
  return response;
}

export async function deleteTabocalypseAlarmViaBackground(
  name: string,
): Promise<TTabocalypseAlarmDeleteResponse> {
  const response = await browser.runtime.sendMessage({
    type: TABOCALYPSE_ALARM_DELETE,
    name,
  });
  if (!isDeleteResponse(response)) {
    return { ok: false, error: BACKGROUND_NO_RESPONSE };
  }
  return response;
}

export async function sendTabocalypseTestNotificationViaBackground(): Promise<TTabocalypseAlarmTestNotificationResponse> {
  const response = await browser.runtime.sendMessage({
    type: TABOCALYPSE_ALARM_TEST_NOTIFICATION,
  });
  if (!isScheduleResponse(response)) {
    return { ok: false, error: BACKGROUND_NO_RESPONSE };
  }
  return response;
}
