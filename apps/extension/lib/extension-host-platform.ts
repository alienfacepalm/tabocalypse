/** True when the extension page runs on macOS (desktop or laptop). */
export function isMacOsHost(): boolean {
  try {
    const ua = navigator.userAgent;
    if (/Macintosh|Mac OS X/.test(ua)) return true;
    const platform = navigator.platform;
    return typeof platform === "string" && platform.startsWith("Mac");
  } catch {
    return false;
  }
}
