import { describe, expect, it } from "vitest";
import { steamChartsTopPageUrl } from "./steam-charts-virtual";

describe("steamChartsTopPageUrl", () => {
  it("maps page 1 to /top and later pages to /top/p.N", () => {
    expect(steamChartsTopPageUrl(1)).toBe("https://steamcharts.com/top");
    expect(steamChartsTopPageUrl(0)).toBe("https://steamcharts.com/top");
    expect(steamChartsTopPageUrl(2)).toBe("https://steamcharts.com/top/p.2");
    expect(steamChartsTopPageUrl(3.9)).toBe("https://steamcharts.com/top/p.3");
  });
});
