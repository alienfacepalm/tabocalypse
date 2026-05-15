import { describe, expect, it } from "vitest";
import { marketRowFromChartPayload } from "./crypto-market-row";

describe("marketRowFromChartPayload", () => {
  it("builds a row from CoinGecko-style prices series", () => {
    const row = marketRowFromChartPayload(
      {
        prices: [
          [1, 100],
          [2, 110],
        ],
      },
      "BTC",
    );
    expect(row.ticker).toBe("BTC");
    expect(row.lastPriceUsd).toBe(110);
    expect(row.changePct).toBeCloseTo(10, 5);
    expect(row.prices.length).toBeGreaterThanOrEqual(2);
  });

  it("throws on insufficient samples", () => {
    expect(() => marketRowFromChartPayload({ prices: [[1, 50]] }, "ETH")).toThrow(
      "Unexpected crypto chart payload",
    );
  });
});
