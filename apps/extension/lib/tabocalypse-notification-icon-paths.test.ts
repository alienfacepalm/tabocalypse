import { describe, expect, it } from "vitest";
import { TABOCALYPSE_NOTIFICATION_ICON_CANDIDATES } from "./alarm-meta";
import {
  tabocalypseNotificationIconRelativePaths,
  tabocalypseNotificationIconUrlAttempts,
} from "./tabocalypse-notification-icon-paths";

describe("tabocalypseNotificationIconRelativePaths", () => {
  it("merges manifest icons with packaged fallbacks without duplicates", () => {
    expect(tabocalypseNotificationIconRelativePaths(["icons/128.png", "custom/icon.png"])).toEqual([
      ...TABOCALYPSE_NOTIFICATION_ICON_CANDIDATES,
      "custom/icon.png",
    ]);
  });
});

describe("tabocalypseNotificationIconUrlAttempts", () => {
  it("tries relative paths before runtime.getURL for each packaged icon", () => {
    expect(
      tabocalypseNotificationIconUrlAttempts(
        ["icons/128.png"],
        (path) => `chrome-extension://id/${path}`,
      ),
    ).toEqual(["icons/128.png", "chrome-extension://id/icons/128.png"]);
  });

  it("tries runtime.getURL before relative paths on extension pages", () => {
    expect(
      tabocalypseNotificationIconUrlAttempts(
        ["icons/128.png"],
        (path) => `chrome-extension://id/${path}`,
        false,
      ),
    ).toEqual(["chrome-extension://id/icons/128.png", "icons/128.png"]);
  });
});
