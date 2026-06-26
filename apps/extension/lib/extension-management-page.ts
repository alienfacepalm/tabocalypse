import browser from "webextension-polyfill";
import { detectExtensionHostBrowser, type TExtensionHostBrowser } from "./extension-host-browser";

export type { TExtensionHostBrowser };
export { detectExtensionHostBrowser };

export interface IExtensionReloadHint {
  browser: TExtensionHostBrowser;
  /** Browser-internal extensions page when one exists; Safari uses Settings instead. */
  managementPageUrl: string | null;
  /** Link label for the extensions / add-ons page. */
  managementPageLabel: string;
}

export function getExtensionReloadHint(
  hostBrowser: TExtensionHostBrowser = detectExtensionHostBrowser(),
): IExtensionReloadHint {
  switch (hostBrowser) {
    case "edge":
      return {
        browser: "edge",
        managementPageUrl: "edge://extensions",
        managementPageLabel: "Edge extensions",
      };
    case "firefox":
      return {
        browser: "firefox",
        managementPageUrl: "about:addons",
        managementPageLabel: "Firefox Add-ons",
      };
    case "safari":
      return {
        browser: "safari",
        managementPageUrl: null,
        managementPageLabel: "Safari extensions",
      };
    case "chrome":
      return {
        browser: "chrome",
        managementPageUrl: "chrome://extensions",
        managementPageLabel: "Chrome extensions",
      };
    default:
      return {
        browser: "unknown",
        managementPageUrl: "chrome://extensions",
        managementPageLabel: "browser extensions",
      };
  }
}

export function openExtensionManagementPage(
  hostBrowser: TExtensionHostBrowser = detectExtensionHostBrowser(),
): void {
  const { managementPageUrl } = getExtensionReloadHint(hostBrowser);
  if (!managementPageUrl) return;
  void browser.tabs.create({ url: managementPageUrl });
}
