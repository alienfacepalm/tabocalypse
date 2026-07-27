import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("../privileged-extension-fetch", () => ({
  privilegedExtensionFetchText: vi.fn(),
  privilegedExtensionFetchJson: vi.fn(),
}));

import {
  privilegedExtensionFetchJson,
  privilegedExtensionFetchText,
} from "../privileged-extension-fetch";
import {
  fetchSteamChartsLeaderboard,
  fetchSteamChartsOpenPage,
} from "./fetch-steamcharts-leaderboard";

const textMock = vi.mocked(privilegedExtensionFetchText);
const jsonMock = vi.mocked(privilegedExtensionFetchJson);
const fixtureDir = dirname(fileURLToPath(import.meta.url));
const topGamesHtml = readFileSync(join(fixtureDir, "fixtures/top-games.fixture.html"), "utf8");

describe("fetchSteamChartsLeaderboard", () => {
  beforeEach(() => {
    textMock.mockReset();
    jsonMock.mockReset();
  });

  it("uses open steamcharts.com data by default (even when an API key is set)", async () => {
    textMock.mockResolvedValue(topGamesHtml);

    const result = await fetchSteamChartsLeaderboard({
      maxRows: 5,
      steamWebApiKey: "test-key",
    });
    expect(result.source).toBe("open");
    expect(result.valueLabel).toBe("Players now");
    expect(textMock).toHaveBeenCalledWith("https://steamcharts.com/top");
    expect(jsonMock).not.toHaveBeenCalled();
    expect(result.entries[0]).toEqual({
      rank: 1,
      appId: 730,
      name: "Counter-Strike 2",
      value: 610069,
    });
    expect(result.hasMore).toBe(false);
  });

  it("requests later open pages from /top/p.N", async () => {
    textMock.mockResolvedValue(topGamesHtml);
    await fetchSteamChartsOpenPage(2);
    expect(textMock).toHaveBeenCalledWith("https://steamcharts.com/top/p.2");
  });

  it("loads owned games by last played with hours when mode is recent", async () => {
    jsonMock.mockResolvedValueOnce({
      response: {
        game_count: 3,
        games: [
          {
            appid: 440,
            name: "Team Fortress 2",
            playtime_forever: 120,
            rtime_last_played: 1_700_000_000,
          },
          {
            appid: 730,
            name: "Counter-Strike 2",
            playtime_forever: 600,
            rtime_last_played: 1_800_000_000,
          },
          {
            appid: 570,
            name: "Dota 2",
            playtime_forever: 0,
            rtime_last_played: 0,
          },
        ],
      },
    });

    const result = await fetchSteamChartsLeaderboard({
      mode: "recent",
      maxRows: 10,
      steamWebApiKey: "test-key",
      steamId: "76561198000000000",
    });
    expect(result.source).toBe("recent");
    expect(result.valueLabel).toBe("Hours played");
    expect(jsonMock.mock.calls[0]?.[0]).toContain("GetOwnedGames");
    expect(result.entries).toEqual([
      {
        rank: 1,
        appId: 730,
        name: "Counter-Strike 2",
        value: 10,
        lastPlayedAtSec: 1_800_000_000,
      },
      {
        rank: 2,
        appId: 440,
        name: "Team Fortress 2",
        value: 2,
        lastPlayedAtSec: 1_700_000_000,
      },
    ]);
    expect(textMock).not.toHaveBeenCalled();
  });

  it("requires a Steam ID for recently played mode", async () => {
    await expect(
      fetchSteamChartsLeaderboard({
        mode: "recent",
        steamWebApiKey: "test-key",
      }),
    ).rejects.toThrow(/Steam ID/);
    expect(jsonMock).not.toHaveBeenCalled();
  });
});
