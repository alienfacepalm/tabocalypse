import type { IScheduleTabocalypseAlarmInput } from "./tabocalypse-alarm-service";
import {
  extensionRuntimeSendMessage,
  PRIV_FETCH_BACKGROUND_NO_RESPONSE,
} from "./privileged-extension-fetch";
import {
  TABOCALYPSE_ALARM_DELETE,
  TABOCALYPSE_ALARM_SCHEDULE,
  TABOCALYPSE_ALARM_TEST_NOTIFICATION,
  type TTabocalypseAlarmDeleteResponse,
  type TTabocalypseAlarmScheduleResponse,
  type TTabocalypseAlarmTestNotificationResponse,
} from "./tabocalypse-alarm-message";

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
  try {
    const response = await extensionRuntimeSendMessage<TTabocalypseAlarmScheduleResponse>({
      type: TABOCALYPSE_ALARM_SCHEDULE,
      whenMs: input.whenMs,
      message: input.message,
      existingName: input.existingName ?? null,
    });
    if (!isScheduleResponse(response)) {
      return { ok: false, error: PRIV_FETCH_BACKGROUND_NO_RESPONSE };
    }
    return response;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : PRIV_FETCH_BACKGROUND_NO_RESPONSE,
    };
  }
}

export async function deleteTabocalypseAlarmViaBackground(
  name: string,
): Promise<TTabocalypseAlarmDeleteResponse> {
  try {
    const response = await extensionRuntimeSendMessage<TTabocalypseAlarmDeleteResponse>({
      type: TABOCALYPSE_ALARM_DELETE,
      name,
    });
    if (!isDeleteResponse(response)) {
      return { ok: false, error: PRIV_FETCH_BACKGROUND_NO_RESPONSE };
    }
    return response;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : PRIV_FETCH_BACKGROUND_NO_RESPONSE,
    };
  }
}

export async function sendTabocalypseTestNotificationViaBackground(): Promise<TTabocalypseAlarmTestNotificationResponse> {
  try {
    const response = await extensionRuntimeSendMessage<TTabocalypseAlarmTestNotificationResponse>({
      type: TABOCALYPSE_ALARM_TEST_NOTIFICATION,
    });
    if (!isScheduleResponse(response)) {
      return { ok: false, error: PRIV_FETCH_BACKGROUND_NO_RESPONSE };
    }
    return response;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : PRIV_FETCH_BACKGROUND_NO_RESPONSE,
    };
  }
}
