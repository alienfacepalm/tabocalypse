import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { tabs: { create: vi.fn() } },
}));

import browser from "webextension-polyfill";
import {
  detectExtensionHostBrowser,
  getExtensionReloadHint,
  openExtensionManagementPage,
} from "./extension-management-page";

function stubLocation(protocol: string): void {
  vi.stubGlobal("location", { protocol } as Location);
}

function stubUserAgent(userAgent: string): void {
  vi.stubGlobal("navigator", { userAgent } as Navigator);
}

describe("detectExtensionHostBrowser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects Firefox from moz-extension protocol", () => {
    stubLocation("moz-extension:");
    expect(detectExtensionHostBrowser()).toBe("firefox");
  });

  it("detects Safari from safari-web-extension protocol", () => {
    stubLocation("safari-web-extension:");
    expect(detectExtensionHostBrowser()).toBe("safari");
  });

  it("detects Edge from chrome-extension protocol and Edg user agent", () => {
    stubLocation("chrome-extension:");
    stubUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    );
    expect(detectExtensionHostBrowser()).toBe("edge");
  });

  it("detects Chrome from chrome-extension protocol without Edg", () => {
    stubLocation("chrome-extension:");
    stubUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    expect(detectExtensionHostBrowser()).toBe("chrome");
  });
});

describe("getExtensionReloadHint", () => {
  it("returns browser-specific management URLs", () => {
    expect(getExtensionReloadHint("chrome").managementPageUrl).toBe("chrome://extensions");
    expect(getExtensionReloadHint("edge").managementPageUrl).toBe("edge://extensions");
    expect(getExtensionReloadHint("firefox").managementPageUrl).toBe("about:addons");
    expect(getExtensionReloadHint("safari").managementPageUrl).toBeNull();
  });
});

describe("openExtensionManagementPage", () => {
  afterEach(() => {
    vi.mocked(browser.tabs.create).mockClear();
  });

  it("opens the management page in a new tab", () => {
    openExtensionManagementPage("chrome");
    expect(browser.tabs.create).toHaveBeenCalledWith({ url: "chrome://extensions" });
  });

  it("does not open a tab for Safari", () => {
    openExtensionManagementPage("safari");
    expect(browser.tabs.create).not.toHaveBeenCalled();
  });
});
