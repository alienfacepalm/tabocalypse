import { afterEach, describe, expect, it, vi } from "vitest";
import { detectExtensionHostBrowser } from "./extension-host-browser";

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

  it("returns unknown outside extension page protocols", () => {
    stubLocation("https:");
    expect(detectExtensionHostBrowser()).toBe("unknown");
  });
});
