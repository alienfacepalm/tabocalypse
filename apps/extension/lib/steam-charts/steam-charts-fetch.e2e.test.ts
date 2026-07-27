import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import { PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND } from "../privileged-extension-fetch";
import { privilegedFetchTextInBackground } from "../privileged-extension-fetch-handler";

describe("steam charts privileged fetch (e2e)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("allows steamcharts.com top page through the privileged background fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      url: "https://steamcharts.com/top",
      text: async () => "<html><body>Top Games</body></html>",
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await privilegedFetchTextInBackground("https://steamcharts.com/top");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toContain("Top Games");
    expect(fetchMock).toHaveBeenCalledWith("https://steamcharts.com/top", {
      credentials: "omit",
      cache: "no-store",
      redirect: "follow",
    });
  });

  it("rejects a redirect off steamcharts.com", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      url: "https://evil.example/phish",
      text: async () => "nope",
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await privilegedFetchTextInBackground("https://steamcharts.com/top");
    expect(result).toEqual({ ok: false, error: PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND });
  });

  it("fetches live steamcharts.com HTML when the network is available", async () => {
    let result: Awaited<ReturnType<typeof privilegedFetchTextInBackground>>;
    try {
      result = await privilegedFetchTextInBackground("https://steamcharts.com/top");
    } catch (error) {
      console.warn(
        "[steam-charts-fetch.e2e] Skipping — host unreachable:",
        error instanceof Error ? error.message : error,
      );
      return;
    }
    if (!result.ok) {
      console.warn("[steam-charts-fetch.e2e] Skipping — privileged fetch failed:", result.error);
      return;
    }
    expect(result.text.length).toBeGreaterThan(200);
    expect(result.text.toLowerCase()).toMatch(/steam|game|player/);
  }, 20_000);
});
