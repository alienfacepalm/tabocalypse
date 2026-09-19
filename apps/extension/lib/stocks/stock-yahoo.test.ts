import { describe, expect, it } from "vitest";
import { coerceMarketsPanelView } from "./markets-panel-view";
import {
  coerceStockWatchlist,
  DEFAULT_STOCK_WATCHLIST,
  MAX_STOCK_WATCHLIST,
  normalizeStockSymbol,
} from "./stock-watchlist";
import { stockRowFromYahooChartPayload, yahooChartUrl } from "./stock-yahoo-chart";
import { parseYahooSearchPayload, yahooSearchUrl } from "./stock-yahoo-search";

function chartPayload(closes: (number | null)[], meta: Record<string, unknown>): unknown {
  return { chart: { result: [{ meta, indicators: { quote: [{ close: closes }] } }], error: null } };
}

describe("stock-watchlist", () => {
  it("accepts any well-formed ticker and rejects junk", () => {
    expect(normalizeStockSymbol(" brk-b ")).toBe("BRK-B");
    expect(normalizeStockSymbol("^gspc")).toBe("^GSPC");
    expect(normalizeStockSymbol("shop.to")).toBe("SHOP.TO");
    expect(normalizeStockSymbol("ES=F")).toBe("ES=F");
    expect(normalizeStockSymbol("../etc")).toBeNull();
    expect(normalizeStockSymbol("A B")).toBeNull();
    expect(normalizeStockSymbol("")).toBeNull();
    expect(normalizeStockSymbol(42)).toBeNull();
  });

  it("dedupes, caps, and falls back to defaults", () => {
    expect(coerceStockWatchlist([{ symbol: "tsla", name: " Tesla " }, { symbol: "TSLA" }])).toEqual(
      [{ symbol: "TSLA", name: "Tesla" }],
    );
    const many = Array.from({ length: 20 }, (_, i) => ({ symbol: `T${i}` }));
    expect(coerceStockWatchlist(many)).toHaveLength(MAX_STOCK_WATCHLIST);
    expect(coerceStockWatchlist("nope")).toEqual([...DEFAULT_STOCK_WATCHLIST]);
    expect(coerceStockWatchlist([{ symbol: "!!" }])).toEqual([...DEFAULT_STOCK_WATCHLIST]);
  });
});

describe("markets-panel-view", () => {
  it("coerces unknown values to the fallback", () => {
    expect(coerceMarketsPanelView("stocks", "crypto")).toBe("stocks");
    expect(coerceMarketsPanelView("bonds", "crypto")).toBe("crypto");
  });
});

describe("stock-yahoo-chart", () => {
  it("maps chart ranges and encodes symbols", () => {
    expect(yahooChartUrl("^GSPC", 1)).toBe(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=1d&interval=5m",
    );
    expect(yahooChartUrl("AAPL", 7)).toContain("range=5d&interval=30m");
    expect(yahooChartUrl("AAPL", 365)).toContain("range=1y&interval=1d");
  });

  it("skips null bars, appends the live price, and uses previous close for the day change", () => {
    const row = stockRowFromYahooChartPayload(
      chartPayload([100, null, 104], {
        currency: "USD",
        regularMarketPrice: 110,
        chartPreviousClose: 88,
      }),
      "AAPL",
      1,
    );
    expect(row.prices).toEqual([100, 104, 110]);
    expect(row.lastPriceUsd).toBe(110);
    expect(row.changePct).toBeCloseTo(25);
    expect(row.currency).toBeUndefined();
  });

  it("uses the window change on longer ranges and keeps non-USD currency verbatim", () => {
    const row = stockRowFromYahooChartPayload(
      chartPayload([200, 150], { currency: "GBp", chartPreviousClose: 1 }),
      "VOD.L",
      30,
    );
    expect(row.changePct).toBeCloseTo(-25);
    expect(row.currency).toBe("GBp");
  });

  it("throws Yahoo's description for unknown tickers and on empty series", () => {
    expect(() =>
      stockRowFromYahooChartPayload(
        {
          chart: { result: null, error: { description: "No data found, symbol may be delisted" } },
        },
        "NOPE",
        1,
      ),
    ).toThrow("No data found");
    expect(() => stockRowFromYahooChartPayload(chartPayload([], {}), "NOPE", 1)).toThrow(
      "No price data",
    );
  });
});

describe("stock-yahoo-search", () => {
  it("builds search URLs", () => {
    expect(yahooSearchUrl(" berkshire b ")).toBe(
      "https://query1.finance.yahoo.com/v1/finance/search?q=berkshire%20b&quotesCount=10&newsCount=0",
    );
  });

  it("keeps priceable instruments and drops options / crypto pairs", () => {
    const hits = parseYahooSearchPayload({
      quotes: [
        { symbol: "TSLA", shortname: "Tesla, Inc.", quoteType: "EQUITY", exchDisp: "NASDAQ" },
        { symbol: "BTC-USD", shortname: "Bitcoin USD", quoteType: "CRYPTOCURRENCY" },
        { symbol: "TSLA250620C00300000", quoteType: "OPTION" },
        { symbol: "TSLZ", longname: "T-Rex 2X Inverse Tesla", quoteType: "ETF", exchDisp: "BATS" },
        { symbol: "bad symbol", quoteType: "EQUITY" },
      ],
    });
    expect(hits).toEqual([
      { symbol: "TSLA", name: "Tesla, Inc.", detail: "NASDAQ · Equity" },
      { symbol: "TSLZ", name: "T-Rex 2X Inverse Tesla", detail: "BATS · ETF" },
    ]);
    expect(parseYahooSearchPayload(null)).toEqual([]);
  });
});
