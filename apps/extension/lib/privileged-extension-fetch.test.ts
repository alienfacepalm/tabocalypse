import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import browser from "webextension-polyfill";
import {
  arrayBufferToBase64,
  coercePrivilegedFetchJsonHeaders,
  isPrivilegedExtensionFetchUrlAllowed,
  isPrivilegedFetchAllowlistError,
  privilegedExtensionFetchJson,
  TABOCALYPSE_PRIV_FETCH_JSON,
} from "./privileged-extension-fetch";

interface IGlobalWithOptionalChrome {
  chrome?: { runtime?: { id?: string; sendMessage?: (message: unknown) => unknown } };
  browser?: { runtime?: { sendMessage?: (message: unknown) => unknown } };
}

describe("isPrivilegedExtensionFetchUrlAllowed", () => {
  it("allows Peapix and Open-Meteo HTTPS URLs", () => {
    expect(isPrivilegedExtensionFetchUrlAllowed("https://peapix.com/bing/feed?country=us")).toBe(
      true,
    );
    expect(isPrivilegedExtensionFetchUrlAllowed("https://img.peapix.com/x.jpg")).toBe(true);
    expect(
      isPrivilegedExtensionFetchUrlAllowed(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1",
      ),
    ).toBe(true);
    expect(isPrivilegedExtensionFetchUrlAllowed("https://2lakes.app/api/all-buoy-data")).toBe(true);
  });

  it("rejects other hosts and non-HTTPS schemes", () => {
    expect(
      isPrivilegedExtensionFetchUrlAllowed("https://www.bing.com/HPImageArchive.aspx?format=js"),
    ).toBe(false);
    expect(isPrivilegedExtensionFetchUrlAllowed("http://peapix.com/x")).toBe(false);
    expect(isPrivilegedExtensionFetchUrlAllowed("not a url")).toBe(false);
  });
});

describe("isPrivilegedFetchAllowlistError", () => {
  it("matches foreground and background allowlist messages", () => {
    expect(
      isPrivilegedFetchAllowlistError("URL is not allowlisted for privileged extension fetch."),
    ).toBe(true);
    expect(isPrivilegedFetchAllowlistError("URL not allowlisted for privileged fetch.")).toBe(true);
    expect(isPrivilegedFetchAllowlistError("HTTP 403")).toBe(false);
  });
});

describe("coercePrivilegedFetchJsonHeaders", () => {
  it("allows Authorization Bearer on 2lakes URLs only", () => {
    expect(
      coercePrivilegedFetchJsonHeaders("https://2lakes.app/api/all-buoy-data", {
        Authorization: "Bearer secret",
      }),
    ).toEqual({ Authorization: "Bearer secret" });
    expect(
      coercePrivilegedFetchJsonHeaders("https://peapix.com/x", {
        Authorization: "Bearer secret",
      }),
    ).toBeUndefined();
  });
});

describe("privilegedExtensionFetchJson", () => {
  afterEach(() => {
    delete (globalThis as IGlobalWithOptionalChrome).chrome;
    delete (globalThis as IGlobalWithOptionalChrome).browser;
    vi.unstubAllGlobals();
    Reflect.deleteProperty(browser.runtime, "sendMessage");
    vi.restoreAllMocks();
  });

  it("uses chrome.runtime.sendMessage when browser.runtime has no id (Chromium/Edge quirk)", async () => {
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      data: [{ fullUrl: "https://img.peapix.com/x.jpg" }],
    });
    (globalThis as IGlobalWithOptionalChrome).chrome = {
      runtime: { id: "test-extension-id", sendMessage },
    };
    const data = await privilegedExtensionFetchJson("https://peapix.com/bing/feed?country=us");
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledWith({
      type: TABOCALYPSE_PRIV_FETCH_JSON,
      url: "https://peapix.com/bing/feed?country=us",
    });
    expect(data).toEqual([{ fullUrl: "https://img.peapix.com/x.jpg" }]);
  });

  it("prefers chrome.runtime.sendMessage when both chrome and browser expose sendMessage", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" } as unknown as Location);
    const chromeSendMessage = vi.fn().mockResolvedValue({
      ok: true,
      data: [{ fullUrl: "https://img.peapix.com/preferred.jpg" }],
    });
    const browserSendMessage = vi.fn();
    (globalThis as IGlobalWithOptionalChrome).chrome = {
      runtime: { id: "ext", sendMessage: chromeSendMessage },
    };
    Object.assign(browser.runtime, { id: "ext", sendMessage: browserSendMessage });
    const data = await privilegedExtensionFetchJson("https://peapix.com/bing/feed?country=us");
    expect(chromeSendMessage).toHaveBeenCalledOnce();
    expect(browserSendMessage).not.toHaveBeenCalled();
    expect(data).toEqual([{ fullUrl: "https://img.peapix.com/preferred.jpg" }]);
  });

  it("uses browser.runtime.sendMessage on extension-scheme pages when runtime.id is absent", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" } as unknown as Location);
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      data: [{ fullUrl: "https://img.peapix.com/y.jpg" }],
    });
    Object.assign(browser.runtime, { sendMessage });
    const data = await privilegedExtensionFetchJson("https://peapix.com/bing/feed?country=us");
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledWith({
      type: TABOCALYPSE_PRIV_FETCH_JSON,
      url: "https://peapix.com/bing/feed?country=us",
    });
    expect(data).toEqual([{ fullUrl: "https://img.peapix.com/y.jpg" }]);
  });

  it("forwards Authorization headers for 2lakes requests", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" } as unknown as Location);
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      data: [{ location: "Lake Sammamish Buoy" }],
    });
    (globalThis as IGlobalWithOptionalChrome).chrome = {
      runtime: { id: "ext", sendMessage },
    };
    await privilegedExtensionFetchJson("https://2lakes.app/api/all-buoy-data", undefined, {
      headers: { Authorization: "Bearer test-key" },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: TABOCALYPSE_PRIV_FETCH_JSON,
      url: "https://2lakes.app/api/all-buoy-data",
      headers: { Authorization: "Bearer test-key" },
    });
  });
});

describe("arrayBufferToBase64", () => {
  it("encodes bytes for transport over runtime messages", () => {
    const buf = new Uint8Array([1, 2, 3, 255]).buffer;
    const b64 = arrayBufferToBase64(buf);
    expect(atob(b64)).toBe(String.fromCharCode(1, 2, 3, 255));
  });
});
