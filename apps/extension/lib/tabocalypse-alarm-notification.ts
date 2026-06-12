import browser from "webextension-polyfill";
import {
  getExtensionChromeRuntime,
  isExtensionServiceWorkerContext,
  promisifyExtensionChromeApi,
  withExtensionPromiseTimeout,
} from "./extension-chrome-promisify";
import { extensionRuntimeSendMessage } from "./privileged-extension-fetch";
import { tabocalypseAlarmNotificationId, tabocalypseTestNotificationId } from "./alarm-meta";
import { coerceAlarmMetaMessage } from "./alarm-meta-message";
import { TABOCALYPSE_ALARM_TEST_NOTIFICATION } from "./tabocalypse-alarm-message";
import { TABOCALYPSE_ALARM_DEFAULT_MESSAGE } from "./tabocalypse-alarm-validation";
import {
  tabocalypseNotificationIconRelativePaths,
  tabocalypseNotificationIconUrlAttempts,
} from "./tabocalypse-notification-icon-paths";

export const TABOCALYPSE_ALARM_NOTIFICATION_TITLE = "Tabocalypse";

/** MV3 service workers can exit before Windows receives the toast unless we hold briefly. */
export const TABOCALYPSE_NOTIFICATION_KEEPALIVE_MS = 750;

const NOTIFICATION_CREATE_TIMEOUT_MS = 12_000;

export const TABOCALYPSE_NOTIFICATION_DENIED_MESSAGE =
  "Notifications are blocked for Tabocalypse. In your browser, open the extension’s site settings and allow notifications. On Windows, also check Settings → System → Notifications for your browser (Chrome or Edge).";

export type TTabocalypseNotificationResult = { ok: true } | { ok: false; error: string };

export type TNotificationPermissionLevel = "granted" | "denied" | "unknown";

export type TBasicNotificationOptions = {
  type: "basic";
  title: string;
  message: string;
  iconUrl: string;
};

export interface ITabocalypseAlarmNotificationCopy {
  title: string;
  message: string;
}

const TABOCALYPSE_ALARM_TEST_FALLBACK_MESSAGE =
  "If you see this, Tabocalypse notifications are working." as const;

/** Map stored alarm text to OS notification title/body (Windows emphasizes the title line). */
export function resolveTabocalypseAlarmNotificationCopy(
  rawMessage: unknown,
  options?: { testFallback?: string },
): ITabocalypseAlarmNotificationCopy {
  const reminder = coerceAlarmMetaMessage(rawMessage).trim() || TABOCALYPSE_ALARM_DEFAULT_MESSAGE;

  if (reminder !== TABOCALYPSE_ALARM_DEFAULT_MESSAGE) {
    return {
      title: reminder,
      message: TABOCALYPSE_ALARM_NOTIFICATION_TITLE,
    };
  }

  if (options?.testFallback?.trim()) {
    return {
      title: options.testFallback.trim(),
      message: TABOCALYPSE_ALARM_NOTIFICATION_TITLE,
    };
  }

  return {
    title: TABOCALYPSE_ALARM_NOTIFICATION_TITLE,
    message: TABOCALYPSE_ALARM_DEFAULT_MESSAGE,
  };
}

interface IChromeNotificationsShim {
  create?: (
    notificationId: string,
    options: TBasicNotificationOptions,
    callback?: (createdId: string) => void,
  ) => Promise<string> | void;
  getPermissionLevel?: (callback?: (level: string) => void) => Promise<string> | void;
}

interface IGlobalWithOptionalChrome {
  chrome?: { notifications?: IChromeNotificationsShim };
}

function getChromeNotifications(): IChromeNotificationsShim | undefined {
  return (globalThis as IGlobalWithOptionalChrome).chrome?.notifications;
}

export function formatTabocalypseNotificationError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (typeof err === "string" && err.trim()) return err.trim();
  return "Notification failed.";
}

export function isTabocalypseNotificationPermissionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("permission") ||
    lower.includes("denied") ||
    lower.includes("blocked") ||
    lower.includes("not allowed")
  );
}

function shouldRethrowNotificationAttemptError(err: unknown): boolean {
  return err instanceof Error && /timed out/i.test(err.message);
}

function listManifestIconPaths(): string[] {
  const manifest = browser.runtime.getManifest();
  if (manifest.icons == null) return [];
  return Object.values(manifest.icons).filter(
    (value): value is string => typeof value === "string",
  );
}

/** Exported for unit tests — builds icon+title/body option sets for `notifications.create`. */
export function buildTabocalypseNotificationOptionSets(
  copy: ITabocalypseAlarmNotificationCopy,
): TBasicNotificationOptions[] {
  const relativePaths = tabocalypseNotificationIconRelativePaths(listManifestIconPaths());
  const iconUrls = tabocalypseNotificationIconUrlAttempts(
    relativePaths,
    (path) => browser.runtime.getURL(path),
    isExtensionServiceWorkerContext(),
  );
  return iconUrls.map((iconUrl) => ({
    type: "basic",
    title: copy.title,
    message: copy.message,
    iconUrl,
  }));
}

async function createNotificationWithBrowserPolyfill(
  notificationId: string,
  options: TBasicNotificationOptions,
): Promise<string | null> {
  if (typeof browser.notifications?.create !== "function") return null;
  try {
    const maybePromise = browser.notifications.create(notificationId, options);
    if (maybePromise == null || typeof (maybePromise as Promise<string>).then !== "function") {
      return null;
    }
    const createdId = await withExtensionPromiseTimeout(
      maybePromise as Promise<string>,
      NOTIFICATION_CREATE_TIMEOUT_MS,
      "Timed out waiting for the system notification API.",
    );
    return typeof createdId === "string" && createdId.length > 0 ? createdId : notificationId;
  } catch (err) {
    if (shouldRethrowNotificationAttemptError(err)) throw err;
    return null;
  }
}

async function createNotificationWithChromeApi(
  notificationId: string,
  options: TBasicNotificationOptions,
): Promise<string | null> {
  const chromeNotifications = getChromeNotifications();
  const create = chromeNotifications?.create?.bind(chromeNotifications);
  if (!create) return null;

  const maybePromise = create(notificationId, options);
  if (maybePromise != null && typeof (maybePromise as Promise<string>).then === "function") {
    try {
      const createdId = await withExtensionPromiseTimeout(
        maybePromise as Promise<string>,
        NOTIFICATION_CREATE_TIMEOUT_MS,
        "Timed out waiting for the system notification API.",
      );
      return createdId || notificationId;
    } catch (err) {
      if (shouldRethrowNotificationAttemptError(err)) throw err;
      return null;
    }
  }

  try {
    const createdId = await promisifyExtensionChromeApi<string>(
      (callback) => {
        create(notificationId, options, (id: string) => {
          callback(id);
        });
      },
      NOTIFICATION_CREATE_TIMEOUT_MS,
      "Timed out waiting for the system notification API.",
    );
    return createdId || notificationId;
  } catch (err) {
    if (shouldRethrowNotificationAttemptError(err)) throw err;
    return null;
  }
}

/** Exported for unit tests — one `notifications.create` attempt across polyfill + native Chrome. */
export async function createTabocalypseNotificationOnce(
  notificationId: string,
  options: TBasicNotificationOptions,
): Promise<string> {
  const attempts = [
    () => createNotificationWithChromeApi(notificationId, options),
    () => createNotificationWithBrowserPolyfill(notificationId, options),
  ];

  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result != null) return result;
    } catch (err) {
      if (shouldRethrowNotificationAttemptError(err)) throw err;
      lastError = err;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("notifications.create is unavailable.");
}

async function keepNotificationServiceWorkerAlive(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, TABOCALYPSE_NOTIFICATION_KEEPALIVE_MS);
  });
}

async function createOsNotification(
  notificationId: string,
  copy: ITabocalypseAlarmNotificationCopy,
): Promise<string> {
  const optionSets = buildTabocalypseNotificationOptionSets(copy);
  let lastError: unknown;

  for (const options of optionSets) {
    try {
      const createdId = await createTabocalypseNotificationOnce(notificationId, options);
      await keepNotificationServiceWorkerAlive();
      return createdId;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(formatTabocalypseNotificationError(lastError));
}

export async function getTabocalypseNotificationPermissionLevel(): Promise<TNotificationPermissionLevel> {
  const chromeNotifications = getChromeNotifications();
  if (chromeNotifications?.getPermissionLevel) {
    try {
      const level = await promisifyExtensionChromeApi<string>(
        (callback) => {
          chromeNotifications.getPermissionLevel!((value: string) => {
            callback(value);
          });
        },
        5_000,
        "Timed out reading notification permission.",
      );
      if (level === "granted" || level === "denied") return level;
    } catch {
      /* fall through */
    }
  }

  try {
    const polyfillLevel = (
      browser.notifications as typeof browser.notifications & {
        getPermissionLevel?: () => Promise<"granted" | "denied">;
      }
    ).getPermissionLevel;
    if (typeof polyfillLevel === "function") {
      const level = await polyfillLevel.call(browser.notifications);
      if (level === "granted" || level === "denied") return level;
    }
  } catch {
    /* not supported in every runtime */
  }

  return "unknown";
}

/**
 * Show a Tabocalypse alarm via the browser/OS notifications API.
 * This is the only supported delivery path — do not fall back to in-tab HUD toasts for alarms.
 */
export async function showTabocalypseAlarmNotification(
  alarmName: string,
  rawMessage: unknown,
  options?: { notificationId?: string; testFallback?: string },
): Promise<TTabocalypseNotificationResult> {
  const copy = resolveTabocalypseAlarmNotificationCopy(rawMessage, {
    testFallback: options?.testFallback,
  });
  const notificationId = options?.notificationId ?? tabocalypseAlarmNotificationId(alarmName);

  try {
    await createOsNotification(notificationId, copy);
    return { ok: true };
  } catch (err) {
    const detail = formatTabocalypseNotificationError(err);
    console.error(
      "[Tabocalypse] alarm notification failed:",
      detail,
      describeTabocalypseNotificationRuntime(),
    );
    if (isTabocalypseNotificationPermissionError(detail)) {
      return { ok: false, error: TABOCALYPSE_NOTIFICATION_DENIED_MESSAGE };
    }
    return { ok: false, error: `Could not show a system notification (${detail}).` };
  }
}

function isTabocalypseNotificationResult(value: unknown): value is TTabocalypseNotificationResult {
  return (
    value != null &&
    typeof value === "object" &&
    "ok" in value &&
    typeof (value as { ok: unknown }).ok === "boolean"
  );
}

/** Test OS delivery: try this page first, then the MV3 service worker. */
export async function sendTabocalypseTestNotification(
  rawMessage?: unknown,
): Promise<TTabocalypseNotificationResult> {
  const fromPage = await showTabocalypseAlarmNotification("__test__", rawMessage, {
    notificationId: tabocalypseTestNotificationId(),
    testFallback: TABOCALYPSE_ALARM_TEST_FALLBACK_MESSAGE,
  });
  if (fromPage.ok) return fromPage;

  try {
    const fromBackground = await extensionRuntimeSendMessage<TTabocalypseNotificationResult>({
      type: TABOCALYPSE_ALARM_TEST_NOTIFICATION,
    });
    if (isTabocalypseNotificationResult(fromBackground) && fromBackground.ok) {
      return fromBackground;
    }
  } catch (err) {
    console.error(
      "[Tabocalypse] background test notification failed:",
      formatTabocalypseNotificationError(err),
    );
  }

  return fromPage;
}

/** Background-only entry for the service worker message handler. */
export async function sendTabocalypseTestNotificationFromBackground(): Promise<TTabocalypseNotificationResult> {
  return showTabocalypseAlarmNotification("__test__", undefined, {
    notificationId: tabocalypseTestNotificationId(),
    testFallback: TABOCALYPSE_ALARM_TEST_FALLBACK_MESSAGE,
  });
}

/** True when a notifications API is reachable in this extension context. */
export function hasNativeExtensionNotificationsApi(): boolean {
  return (
    typeof getChromeNotifications()?.create === "function" ||
    typeof browser.notifications?.create === "function"
  );
}

/** Diagnostic string for the service worker console when delivery fails in the field. */
export function describeTabocalypseNotificationRuntime(): string {
  const runtime = getExtensionChromeRuntime();
  return [
    `serviceWorker=${isExtensionServiceWorkerContext()}`,
    `chrome.notifications.create=${typeof getChromeNotifications()?.create}`,
    `browser.notifications.create=${typeof browser.notifications?.create}`,
    `runtime.id=${runtime?.id ?? browser.runtime.id ?? "unknown"}`,
  ].join(", ");
}
