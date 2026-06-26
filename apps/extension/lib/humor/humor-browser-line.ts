import { detectExtensionHostBrowser, type TExtensionHostBrowser } from "../extension-host-browser";

/** Placeholder in built-in humor lines for the detected host browser (generic when unknown). */
export const HUMOR_BROWSER_PLACEHOLDER = "{browser}";

export function humorBrowserLabel(browser: TExtensionHostBrowser): string {
  switch (browser) {
    case "chrome":
      return "Chrome";
    case "edge":
      return "Edge";
    case "firefox":
      return "Firefox";
    case "safari":
      return "Safari";
    default:
      return "browser";
  }
}

/** Substitutes {@link HUMOR_BROWSER_PLACEHOLDER} using the host browser, or generic copy when unsure. */
export function localizeHumorLine(
  line: string,
  browser: TExtensionHostBrowser = detectExtensionHostBrowser(),
): string {
  if (!line.includes(HUMOR_BROWSER_PLACEHOLDER)) return line;
  return line.replaceAll(HUMOR_BROWSER_PLACEHOLDER, humorBrowserLabel(browser));
}
