import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseSteamChartsTopGames } from "./parse-steamcharts";

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
    });
    expect(rows[1]?.appId).toBe(570);
  });
});
