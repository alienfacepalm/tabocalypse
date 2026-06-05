import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import browser from "webextension-polyfill";
import {
  arrayBufferToBase64,
  isPrivilegedExtensionFetchUrlAllowed,
  isPrivilegedFetchAllowlistError,
  isPrivilegedFetchBackgroundUnavailableError,
  PRIV_FETCH_BACKGROUND_NO_RESPONSE,
  PRIV_FETCH_ALLOWLIST_ERROR_FOREGROUND,
  PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE,
  privilegedExtensionFetchJson,
  privilegedExtensionFetchText,
  shouldShowPrivilegedFetchReloadHint,
  TABOCALYPSE_PRIV_FETCH_JSON,
  TABOCALYPSE_PRIV_FETCH_TEXT,
} from "./privileged-extension-fetch";
import { KING_COUNTY_LAKE_BUOY_MAP_DATA_URL } from "./weather/parse-king-county-lake-buoy-map-data";

interface IChromeRuntimeTestShim {
  id?: string;
  lastError?: { message?: string };
  sendMessage?: (message: unknown, responseCallback?: (response: unknown) => void) => unknown;
}

interface IGlobalWithOptionalChrome {
  chrome?: { runtime?: IChromeRuntimeTestShim };
  browser?: { runtime?: { sendMessage?: (message: unknown) => unknown } };
}

describe("isPrivilegedExtensionFetchUrlAllowed", () => {
  it("allows Peapix, Open-Meteo, CoinGecko, King County, Unsuck, and search suggestion hosts", () => {
    expect(isPrivilegedExtensionFetchUrlAllowed("https://peapix.com/bing/feed?country=us")).toBe(
      true,
    );
    expect(isPrivilegedExtensionFetchUrlAllowed("https://img.peapix.com/x.jpg")).toBe(true);
    expect(
      isPrivilegedExtensionFetchUrlAllowed(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1",
      ),
    ).toBe(true);
    expect(isPrivilegedExtensionFetchUrlAllowed(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL)).toBe(true);
    expect(isPrivilegedExtensionFetchUrlAllowed("https://www.unsuck-it.com/classics")).toBe(true);
    expect(isPrivilegedExtensionFetchUrlAllowed("https://duckduckgo.com/ac/?q=tab&type=list")).toBe(
      true,
    );
    expect(
      isPrivilegedExtensionFetchUrlAllowed(
        "https://suggestqueries.google.com/complete/search?client=firefox&q=tab",
      ),
    ).toBe(true);
    expect(isPrivilegedExtensionFetchUrlAllowed("https://api.bing.com/osjson.aspx?query=tab")).toBe(
      true,
    );
    expect(
      isPrivilegedExtensionFetchUrlAllowed(
        `  ${KING_COUNTY_LAKE_BUOY_MAP_DATA_URL.toUpperCase()}  `,
      ),
    ).toBe(true);
  });

  it("rejects other hosts and non-HTTPS schemes", () => {
    expect(
      isPrivilegedExtensionFetchUrlAllowed("https://www.bing.com/HPImageArchive.aspx?format=js"),
    ).toBe(false);
    expect(isPrivilegedExtensionFetchUrlAllowed("https://2lakes.app/api/all-buoy-data")).toBe(
      false,
    );
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

describe("isPrivilegedFetchBackgroundUnavailableError", () => {
  it("matches runtime messaging failures that usually need an extension reload", () => {
    expect(
      isPrivilegedFetchBackgroundUnavailableError(PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE),
    ).toBe(true);
    expect(isPrivilegedFetchBackgroundUnavailableError(PRIV_FETCH_BACKGROUND_NO_RESPONSE)).toBe(
      true,
    );
    expect(isPrivilegedFetchBackgroundUnavailableError("HTTP 403")).toBe(false);
  });
});

describe("shouldShowPrivilegedFetchReloadHint", () => {
  it("combines allowlist and background-unavailable reload cases", () => {
    expect(shouldShowPrivilegedFetchReloadHint(PRIV_FETCH_ALLOWLIST_ERROR_FOREGROUND)).toBe(true);
    expect(shouldShowPrivilegedFetchReloadHint(PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE)).toBe(
      true,
    );
    expect(shouldShowPrivilegedFetchReloadHint("HTTP 503")).toBe(false);
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
    expect(sendMessage.mock.calls[0]?.[0]).toEqual({
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

  it("promisifies native chrome.runtime.sendMessage callback API", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" } as unknown as Location);
    const sendMessage = vi.fn(
      (message: unknown, callback?: (response: unknown) => void): undefined => {
        callback?.({
          ok: true,
          data: { current: { temperature_2m: 12, weather_code: 0 } },
        });
        return undefined;
      },
    );
    (globalThis as IGlobalWithOptionalChrome).chrome = {
      runtime: { id: "ext", sendMessage },
    };

    const data = await privilegedExtensionFetchJson(
      "https://api.open-meteo.com/v1/forecast?latitude=47&longitude=-122",
    );

    expect(sendMessage).toHaveBeenCalledOnce();
    expect(data).toEqual({ current: { temperature_2m: 12, weather_code: 0 } });
  });

  it("maps Chrome message-port-closed errors to background-no-response", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" } as unknown as Location);
    const runtime: IChromeRuntimeTestShim = {
      id: "ext",
      sendMessage: (_message: unknown, callback?: (response: unknown) => void): undefined => {
        runtime.lastError = {
          message: "The message port closed before a response was received.",
        };
        callback?.(undefined);
        return undefined;
      },
    };
    (globalThis as IGlobalWithOptionalChrome).chrome = { runtime };

    await expect(privilegedExtensionFetchText(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL)).rejects.toThrow(
      PRIV_FETCH_BACKGROUND_NO_RESPONSE,
    );
    expect(shouldShowPrivilegedFetchReloadHint(PRIV_FETCH_BACKGROUND_NO_RESPONSE)).toBe(true);
  });

  it("throws a reload hint when the background worker returns no payload", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" } as unknown as Location);
    const sendMessage = vi.fn(
      (_message: unknown, callback?: (response: unknown) => void): undefined => {
        callback?.(undefined);
        return undefined;
      },
    );
    (globalThis as IGlobalWithOptionalChrome).chrome = {
      runtime: { id: "ext", sendMessage },
    };

    await expect(
      privilegedExtensionFetchJson(
        "https://api.open-meteo.com/v1/forecast?latitude=47&longitude=-122",
      ),
    ).rejects.toThrow(PRIV_FETCH_BACKGROUND_NO_RESPONSE);
  });
});

describe("privilegedExtensionFetchText", () => {
  afterEach(() => {
    delete (globalThis as IGlobalWithOptionalChrome).chrome;
    vi.unstubAllGlobals();
    Reflect.deleteProperty(browser.runtime, "sendMessage");
    vi.restoreAllMocks();
  });

  it("does not in-page fetch on extension pages when runtime messaging is unavailable", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" } as unknown as Location);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(privilegedExtensionFetchText(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL)).rejects.toThrow(
      PRIV_FETCH_RUNTIME_SEND_MESSAGE_UNAVAILABLE,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests text through the background worker on extension pages", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" } as unknown as Location);
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      text: "Sammamish|1|2",
    });
    (globalThis as IGlobalWithOptionalChrome).chrome = {
      runtime: { id: "ext", sendMessage },
    };

    const text = await privilegedExtensionFetchText(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL);

    expect(sendMessage.mock.calls[0]?.[0]).toEqual({
      type: TABOCALYPSE_PRIV_FETCH_TEXT,
      url: KING_COUNTY_LAKE_BUOY_MAP_DATA_URL,
    });
    expect(text).toBe("Sammamish|1|2");
  });
});

describe("arrayBufferToBase64", () => {
  it("encodes bytes for transport over runtime messages", () => {
    const buf = new Uint8Array([1, 2, 3, 255]).buffer;
    const b64 = arrayBufferToBase64(buf);
    expect(atob(b64)).toBe(String.fromCharCode(1, 2, 3, 255));
  });
});
