import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import {
  privilegedFetchBytesInBackground,
  privilegedFetchJsonInBackground,
} from "./privileged-extension-fetch-handler";
import {
  PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND,
  PRIV_FETCH_ALLOWLIST_ERROR_FOREGROUND,
} from "./privileged-extension-fetch";

const LAKES_ALL_BUOY_DATA_URL = "https://2lakes.app/api/all-buoy-data";

describe("privilegedFetchJsonInBackground (2 Lakes e2e)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("allows the all-buoy-data URL and forwards Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ location: "Lake Sammamish Buoy", tempF: 67 }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await privilegedFetchJsonInBackground(LAKES_ALL_BUOY_DATA_URL, {
      Authorization: "Bearer test-key",
    });

    expect(result).toEqual({
      ok: true,
      data: [{ location: "Lake Sammamish Buoy", tempF: 67 }],
    });
    expect(fetchMock).toHaveBeenCalledWith(LAKES_ALL_BUOY_DATA_URL, {
      credentials: "omit",
      cache: "no-store",
      headers: { Authorization: "Bearer test-key" },
    });
  });

  it("normalizes host casing before fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    const url = "  https://2LAKES.APP/api/all-buoy-data  ";
    const result = await privilegedFetchJsonInBackground(url, {
      Authorization: "Bearer test-key",
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://2lakes.app/api/all-buoy-data",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-key" },
      }),
    );
  });

  it("rejects hosts outside the privileged allowlist", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await privilegedFetchJsonInBackground("https://evil.example/data");

    expect(result).toEqual({ ok: false, error: PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces API auth errors instead of allowlist errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: "Unauthorized",
          message: "External access requires an API Key.",
        }),
      }),
    );

    const result = await privilegedFetchJsonInBackground(LAKES_ALL_BUOY_DATA_URL, {
      Authorization: "Bearer bad",
    });

    expect(result).toEqual({ ok: false, error: "External access requires an API Key." });
  });
});

describe("privilegedExtensionFetch allowlist messages", () => {
  it("uses distinct foreground vs background copy", () => {
    expect(PRIV_FETCH_ALLOWLIST_ERROR_FOREGROUND).not.toBe(PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND);
  });
});

describe("privilegedFetchBytesInBackground", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects disallowed image hosts", async () => {
    const result = await privilegedFetchBytesInBackground("https://www.bing.com/x.jpg");
    expect(result).toEqual({ ok: false, error: PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND });
  });
});
