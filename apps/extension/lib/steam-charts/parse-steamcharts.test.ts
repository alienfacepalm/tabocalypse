import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  parseSteamChartsAppSummary,
  parseSteamChartsTopGames,
  parseSteamChartsTopRecords,
} from "./parse-steamcharts";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("parseSteamChartsTopGames", () => {
  it("parses the /top table rows", () => {
    const html = readFileSync(join(FIXTURES_DIR, "top-games.fixture.html"), "utf8");
    const rows = parseSteamChartsTopGames(html);
    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual({
      rank: 1,
      appId: 730,
      name: "Counter-Strike 2",
      currentPlayers: 610069,
      peakPlayers: 1573727,
      hoursPlayed: 660240961,
    });
    expect(rows[1]?.appId).toBe(570);
  });
});

describe("parseSteamChartsAppSummary", () => {
  it("parses the app summary header stats", () => {
    const html = readFileSync(join(FIXTURES_DIR, "app-summary.fixture.html"), "utf8");
    const s = parseSteamChartsAppSummary(html, 730);
    expect(s).toEqual({
      appId: 730,
      name: "Counter-Strike 2",
      playingNow: 672707,
      peak24h: 1277323,
      peakAllTime: 1818368,
      updatedAtIso: "2026-07-07T07:00:41Z",
    });
  });
});

describe("parseSteamChartsTopRecords", () => {
  it("parses the top records table", () => {
    const html = `<table id="toppeaks" class="common-table"><tbody><tr><td class="game-name left"><a href="/app/578080">PUBG</a></td><td class="num">3236027</td><td id="toppeaks_578080_time">2018-01-01T00:00:00Z</td></tr></tbody></table>`;
    const rows = parseSteamChartsTopRecords(html);
    expect(rows).toEqual([
      {
        rank: 1,
        appId: 578080,
        name: "PUBG",
        peakAllTime: 3236027,
        timeIso: "2018-01-01T00:00:00Z",
      },
    ]);
  });
});
