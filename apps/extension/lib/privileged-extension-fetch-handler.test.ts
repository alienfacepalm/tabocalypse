import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import {
  privilegedFetchBytesInBackground,
  privilegedFetchJsonInBackground,
  privilegedFetchTextInBackground,
} from "./privileged-extension-fetch-handler";
import {
  PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND,
  PRIV_FETCH_ALLOWLIST_ERROR_FOREGROUND,
} from "./privileged-extension-fetch";
import { KING_COUNTY_LAKE_BUOY_MAP_DATA_URL } from "./weather/parse-king-county-lake-buoy-map-data";
import {
  fetchAllLakesBuoys,
  mapKingCountyRowsToBuoyEntries,
} from "./weather/fetch-lakes-buoy-data";
import { parseKingCountyLakeBuoyMapData } from "./weather/parse-king-county-lake-buoy-map-data";

const FIXTURE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "weather",
  "fixtures",
  "king-county-map-data.fixture.txt",
);

describe("privilegedFetchTextInBackground (King County e2e)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("allows the GenerateMapData URL and returns text", async () => {
    const fixture = readFileSync(FIXTURE_PATH, "utf8");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => fixture,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await privilegedFetchTextInBackground(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(fetchMock).toHaveBeenCalledWith(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL, {
      credentials: "omit",
      cache: "no-store",
    });
    const buoys = mapKingCountyRowsToBuoyEntries(
      parseKingCountyLakeBuoyMapData(result.text),
      "fahrenheit",
    );
    expect(buoys.map((row) => row.label).sort()).toEqual(["Lake Sammamish", "Lake Washington"]);
  });

  it("normalizes host casing before fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const url = `  ${KING_COUNTY_LAKE_BUOY_MAP_DATA_URL}  `;
    const result = await privilegedFetchTextInBackground(url);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL, {
      credentials: "omit",
      cache: "no-store",
    });
  });

  it("rejects hosts outside the privileged allowlist", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await privilegedFetchTextInBackground("https://evil.example/data");

    expect(result).toEqual({ ok: false, error: PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches live King County map data over the network", async () => {
    const result = await privilegedFetchTextInBackground(KING_COUNTY_LAKE_BUOY_MAP_DATA_URL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const buoys = mapKingCountyRowsToBuoyEntries(
      parseKingCountyLakeBuoyMapData(result.text),
      "fahrenheit",
    );
    expect(buoys.length).toBeGreaterThanOrEqual(2);
    expect(buoys.every((row) => row.data.waterTemp > 32)).toBe(true);
  }, 20_000);
});

describe("fetchAllLakesBuoys (King County e2e)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads buoy rows from a live privileged background fetch", async () => {
    const fixture = readFileSync(FIXTURE_PATH, "utf8");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => fixture,
      }),
    );

    const rows = await fetchAllLakesBuoys("fahrenheit");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.data.status).toBe("ACTIVE");
  });
});

describe("privilegedFetchJsonInBackground", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("allows Peapix JSON URLs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ fullUrl: "https://img.peapix.com/x.jpg" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await privilegedFetchJsonInBackground("https://peapix.com/bing/feed?country=us");

    expect(result).toEqual({
      ok: true,
      data: [{ fullUrl: "https://img.peapix.com/x.jpg" }],
    });
  });

  it("rejects hosts outside the privileged allowlist", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await privilegedFetchJsonInBackground("https://evil.example/data");

    expect(result).toEqual({ ok: false, error: PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND });
    expect(fetchMock).not.toHaveBeenCalled();
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
