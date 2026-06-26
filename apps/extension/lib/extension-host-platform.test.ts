import { afterEach, describe, expect, it, vi } from "vitest";
import { isMacOsHost } from "./extension-host-platform";

function stubNavigator(partial: Partial<Navigator>): void {
  vi.stubGlobal("navigator", partial as Navigator);
}

describe("isMacOsHost", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true for Macintosh user agents", () => {
    stubNavigator({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      platform: "MacIntel",
    });
    expect(isMacOsHost()).toBe(true);
  });

  it("returns true when platform starts with Mac", () => {
    stubNavigator({
      userAgent: "Mozilla/5.0",
      platform: "MacIntel",
    });
    expect(isMacOsHost()).toBe(true);
  });

  it("returns false on Windows", () => {
    stubNavigator({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      platform: "Win32",
    });
    expect(isMacOsHost()).toBe(false);
  });
});
