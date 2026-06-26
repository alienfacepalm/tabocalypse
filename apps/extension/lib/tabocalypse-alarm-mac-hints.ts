import { detectExtensionHostBrowser } from "./extension-host-browser";
import { isMacOsHost } from "./extension-host-platform";
import { humorBrowserLabel } from "./humor/humor-browser-line";

/** Windows / generic denied copy (macOS uses {@link getTabocalypseNotificationDeniedMessage}). */
export const TABOCALYPSE_NOTIFICATION_DENIED_MESSAGE_WINDOWS =
  "Notifications are blocked for Tabocalypse. In your browser, open the extension’s site settings and allow notifications. On Windows, also check Settings → System → Notifications for your browser (Chrome or Edge).";

export interface ITabocalypseAlarmMacSetupHint {
  text: string;
}

/** Plain-language steps for macOS notification delivery (Chromium / Firefox on Mac). */
export function listTabocalypseAlarmMacSetupHints(
  browserLabel: string = humorBrowserLabel(detectExtensionHostBrowser()),
): ITabocalypseAlarmMacSetupHint[] {
  return [
    {
      text: `Open System Settings → Notifications → ${browserLabel}, turn notifications on, and try Alerts while testing (banners disappear after a few seconds).`,
    },
    {
      text: "If you miss a banner, open Notification Center from the date and time in the menu bar.",
    },
    {
      text: `Turn off Focus or Do Not Disturb modes that silence ${browserLabel}.`,
    },
    {
      text: `Keep ${browserLabel} running — quitting the app (Cmd+Q) pauses reminders until you open it again.`,
    },
    {
      text: "Use Test notification above before scheduling a reminder.",
    },
  ];
}

export const TABOCALYPSE_ALARM_MAC_SAFARI_UNSUPPORTED_MESSAGE =
  "Clock alarms need a macOS system notification from your browser. Safari Web Extensions cannot show those notifications yet. Use Chrome, Edge, or Firefox on this Mac for clock alarms.";

export function isTabocalypseAlarmMacSafariUnsupported(): boolean {
  return isMacOsHost() && detectExtensionHostBrowser() === "safari";
}

export function getTabocalypseNotificationDeniedMessage(): string {
  if (!isMacOsHost()) return TABOCALYPSE_NOTIFICATION_DENIED_MESSAGE_WINDOWS;
  const browser = humorBrowserLabel(detectExtensionHostBrowser());
  return `Notifications are blocked for Tabocalypse. Open System Settings → Notifications, turn on notifications for ${browser}, and allow Alerts or Banners. Turn off Focus or Do Not Disturb while testing.`;
}

export function getTabocalypseAlarmTestSuccessMessage(): string {
  if (!isMacOsHost()) {
    return "Test notification sent. Check your system notification center if you do not see a banner.";
  }
  return "Test notification sent. On Mac, open Notification Center from the menu bar date and time if you do not see a banner. Alerts stay visible longer than banners.";
}
