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
        {
          id: "cardano",
          symbol: "ada",
          name: "Cardano",
          thumb: "https://coin-images.coingecko.com/coins/images/975/thumb/cardano.png",
        },
        { id: "", symbol: "x", name: "Bad" },
        { id: "not valid", symbol: "BAD", name: "Bad id" },
      ],
    });
    expect(hits).toEqual([
      {
        coinId: "bitcoin",
        symbol: "BTC",
        name: "Bitcoin",
        iconUrl: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
      },
      {
        coinId: "ethereum",
        symbol: "ETH",
        name: "Ethereum",
        iconUrl: expect.stringContaining("ethereum"),
      },
      {
        coinId: "cardano",
        symbol: "ADA",
        name: "Cardano",
        iconUrl: "https://coin-images.coingecko.com/coins/images/975/thumb/cardano.png",
      },
    ]);
  });
});
