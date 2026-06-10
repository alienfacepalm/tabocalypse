import browser from "webextension-polyfill";
import { TABOCALYPSE_ALARM_NOTIFICATION_ICON, tabocalypseAlarmNotificationId } from "./alarm-meta";
import { coerceAlarmMetaMessage } from "./alarm-meta-message";

export const TABOCALYPSE_ALARM_NOTIFICATION_TITLE = "Tabocalypse";

export const TABOCALYPSE_NOTIFICATION_DENIED_MESSAGE =
  "Notifications are blocked for Tabocalypse. In your browser, open the extension’s site settings and allow notifications. In Windows, check Settings → System → Notifications for your browser.";

export type TTabocalypseNotificationResult = { ok: true } | { ok: false; error: string };

export type TNotificationPermissionLevel = "granted" | "denied" | "unknown";

type TBasicNotificationOptions = {
  type: "basic";
  title: string;
  message: string;
  iconUrl?: string;
};

type TNotificationsWithPermissionLevel = {
  getPermissionLevel?: () => Promise<"granted" | "denied">;
};

export async function getTabocalypseNotificationPermissionLevel(): Promise<TNotificationPermissionLevel> {
  try {
    const notifications = browser.notifications as typeof browser.notifications &
      TNotificationsWithPermissionLevel;
    if (typeof notifications.getPermissionLevel === "function") {
      const level = await notifications.getPermissionLevel();
      if (level === "granted" || level === "denied") return level;
    }
  } catch {
    /* not supported in every runtime */
  }
  return "unknown";
}

async function createOsNotification(
  notificationId: string,
  message: string,
  withIcon: boolean,
): Promise<void> {
  const options: TBasicNotificationOptions = {
    type: "basic",
    title: TABOCALYPSE_ALARM_NOTIFICATION_TITLE,
    message,
  };
  if (withIcon) {
    options.iconUrl = browser.runtime.getURL(TABOCALYPSE_ALARM_NOTIFICATION_ICON);
  }
  await browser.notifications.create(notificationId, options);
}

/**
 * Show a Tabocalypse alarm via the browser/OS notifications API.
 * This is the only supported delivery path — do not fall back to in-tab HUD toasts for alarms.
 */
export async function showTabocalypseAlarmNotification(
  alarmName: string,
  rawMessage: unknown,
): Promise<TTabocalypseNotificationResult> {
  const permission = await getTabocalypseNotificationPermissionLevel();
  if (permission === "denied") {
    return { ok: false, error: TABOCALYPSE_NOTIFICATION_DENIED_MESSAGE };
  }

  const message =
    coerceAlarmMetaMessage(rawMessage).trim() || `${TABOCALYPSE_ALARM_NOTIFICATION_TITLE} alarm.`;
  const notificationId = tabocalypseAlarmNotificationId(alarmName);

  try {
    await createOsNotification(notificationId, message, true);
    return { ok: true };
  } catch (withIconErr) {
    try {
      await createOsNotification(notificationId, message, false);
      return { ok: true };
    } catch (withoutIconErr) {
      const detail =
        withoutIconErr instanceof Error
          ? withoutIconErr.message
          : withIconErr instanceof Error
            ? withIconErr.message
            : "Notification failed.";
      console.error("[Tabocalypse] alarm notification failed:", detail);
      return { ok: false, error: `Could not show a system notification (${detail}).` };
    }
  }
}

export async function sendTabocalypseTestNotification(): Promise<TTabocalypseNotificationResult> {
  return showTabocalypseAlarmNotification(
    "__test__",
    "If you see this, Tabocalypse notifications are working.",
  );
}
