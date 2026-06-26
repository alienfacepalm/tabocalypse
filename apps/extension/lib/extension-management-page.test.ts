import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { tabs: { create: vi.fn() } },
}));

import browser from "webextension-polyfill";
import { getExtensionReloadHint, openExtensionManagementPage } from "./extension-management-page";

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
