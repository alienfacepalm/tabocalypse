import { TABOCALYPSE_NOTIFICATION_ICON_CANDIDATES } from "./alarm-meta";

/** Relative packaged paths to try for `chrome.notifications` (MV3 prefers these over `runtime.getURL`). */
export function tabocalypseNotificationIconRelativePaths(
  manifestIconPaths: readonly string[] = [],
): string[] {
  return [...new Set([...TABOCALYPSE_NOTIFICATION_ICON_CANDIDATES, ...manifestIconPaths])];
}

/**
 * Icon URL attempts per path. Service workers prefer relative paths (Chromium MV3);
 * extension pages prefer absolute `runtime.getURL` paths first.
 */
export function tabocalypseNotificationIconUrlAttempts(
  relativePaths: readonly string[],
  getUrl: (path: string) => string,
  preferRelativeFirst = true,
): string[] {
  const attempts: string[] = [];
  for (const path of relativePaths) {
    if (preferRelativeFirst) {
      attempts.push(path, getUrl(path));
    } else {
      attempts.push(getUrl(path), path);
    }
  }
  return [...new Set(attempts)];
}
