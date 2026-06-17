import { describe, expect, it } from "vitest";
import { coinGeckoSearchUrl, parseCoinGeckoSearchPayload } from "./crypto-coingecko-search";

describe("fetch-crypto-search", () => {
  it("builds CoinGecko search URLs", () => {
    expect(coinGeckoSearchUrl(" btc ")).toBe("https://api.coingecko.com/api/v3/search?query=btc");
  });

  it("parses coin hits from search payload", () => {
    const hits = parseCoinGeckoSearchPayload({
      coins: [
        {
          id: "bitcoin",
          symbol: "btc",
          name: "Bitcoin",
          thumb: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
        },
        { id: "ethereum", symbol: "eth", name: "Ethereum" },
        { id: "", symbol: "x", name: "Bad" },
      ],
    });
    expect(hits).toEqual([
      {
        coinId: "bitcoin",
        symbol: "BTC",
        name: "Bitcoin",
        iconUrl: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
      },
      { coinId: "ethereum", symbol: "ETH", name: "Ethereum" },
    ]);
  });
});
