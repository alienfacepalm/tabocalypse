import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getTabocalypseAlarmTestSuccessMessage,
  getTabocalypseNotificationDeniedMessage,
  isTabocalypseAlarmMacSafariUnsupported,
  listTabocalypseAlarmMacSetupHints,
  TABOCALYPSE_ALARM_MAC_SAFARI_UNSUPPORTED_MESSAGE,
} from "./tabocalypse-alarm-mac-hints";

function stubLocation(protocol: string): void {
  vi.stubGlobal("location", { protocol } as Location);
}

function stubMacEdge(): void {
  vi.stubGlobal("navigator", {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    platform: "MacIntel",
  } as Navigator);
  stubLocation("chrome-extension:");
}

function stubWindowsEdge(): void {
  vi.stubGlobal("navigator", {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    platform: "Win32",
  } as Navigator);
  stubLocation("chrome-extension:");
}

describe("tabocalypse-alarm-mac-hints", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists Mac setup hints with the detected browser name", () => {
    stubMacEdge();
    const hints = listTabocalypseAlarmMacSetupHints();
    expect(hints[0]?.text).toContain("Edge");
    expect(hints.some((hint) => hint.text.includes("Cmd+Q"))).toBe(true);
  });

  it("returns Mac-specific denied copy on macOS", () => {
    stubMacEdge();
    expect(getTabocalypseNotificationDeniedMessage()).toContain("System Settings");
    expect(getTabocalypseNotificationDeniedMessage()).toContain("Edge");
  });

  it("returns Windows denied copy off macOS", () => {
    stubWindowsEdge();
    expect(getTabocalypseNotificationDeniedMessage()).toContain("Windows");
  });

  it("returns Mac-specific test success copy on macOS", () => {
    stubMacEdge();
    expect(getTabocalypseAlarmTestSuccessMessage()).toContain("Notification Center");
  });

  it("flags Safari on Mac as unsupported for alarm notifications", () => {
    stubMacEdge();
    vi.stubGlobal("location", { protocol: "safari-web-extension:" } as Location);
    expect(isTabocalypseAlarmMacSafariUnsupported()).toBe(true);
    expect(TABOCALYPSE_ALARM_MAC_SAFARI_UNSUPPORTED_MESSAGE).toContain("Safari");
  });
});
