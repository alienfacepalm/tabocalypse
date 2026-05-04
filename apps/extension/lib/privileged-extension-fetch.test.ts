import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import browser from "webextension-polyfill";
import {
  arrayBufferToBase64,
  isPrivilegedExtensionFetchUrlAllowed,
  privilegedExtensionFetchJson,
  TABOCALYPSE_PRIV_FETCH_JSON,
} from "./privileged-extension-fetch";

interface IGlobalWithOptionalChrome {
  chrome?: { runtime?: { id?: string; sendMessage?: (message: unknown) => unknown } };
}

describe("isPrivilegedExtensionFetchUrlAllowed", () => {
  it("allows Peapix and Open-Meteo HTTPS URLs", () => {
    expect(isPrivilegedExtensionFetchUrlAllowed("https://peapix.com/bing/feed?country=us")).toBe(
      true,
    );
    expect(isPrivilegedExtensionFetchUrlAllowed("https://img.peapix.com/x.jpg")).toBe(true);
    expect(
      isPrivilegedExtensionFetchUrlAllowed(
        "https://api.open-meteo.com/v1/forecast?latitude=1&longitude=2",
      ),
    ).toBe(true);
  });

  it("rejects other hosts and non-HTTPS schemes", () => {
    expect(
      isPrivilegedExtensionFetchUrlAllowed("https://www.bing.com/HPImageArchive.aspx?format=js"),
    ).toBe(false);
    expect(isPrivilegedExtensionFetchUrlAllowed("http://peapix.com/x")).toBe(false);
    expect(isPrivilegedExtensionFetchUrlAllowed("not a url")).toBe(false);
  });
});

describe("privilegedExtensionFetchJson", () => {
  afterEach(() => {
    delete (globalThis as IGlobalWithOptionalChrome).chrome;
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
});

describe("arrayBufferToBase64", () => {
  it("encodes bytes for transport over runtime messages", () => {
    const buf = new Uint8Array([1, 2, 3, 255]).buffer;
    const b64 = arrayBufferToBase64(buf);
    expect(atob(b64)).toBe(String.fromCharCode(1, 2, 3, 255));
  });
});
