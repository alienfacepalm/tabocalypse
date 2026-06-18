import { describe, expect, it } from "vitest";
import { coinGeckoMarketsIconUrl, parseCoinGeckoMarketsIconUrls } from "./crypto-coingecko-markets";

describe("crypto-coingecko-markets", () => {
  it("builds a markets URL for the requested coin ids", () => {
    expect(coinGeckoMarketsIconUrl(["cardano", "usd-coin"])).toBe(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=cardano%2Cusd-coin&order=market_cap_desc&per_page=2&page=1&sparkline=false",
    );
    expect(coinGeckoMarketsIconUrl([])).toBeNull();
  });

  it("parses image URLs from markets payloads", () => {
    expect(
      parseCoinGeckoMarketsIconUrls([
        {
          id: "cardano",
          image: "https://coin-images.coingecko.com/coins/images/975/thumb/cardano.png",
        },
        {
          id: "usd-coin",
          image: "https://coin-images.coingecko.com/coins/images/6319/thumb/USDC.png",
        },
        {
          id: "bad-host",
          image: "https://evil.example/usdc.png",
        },
      ]),
    ).toEqual({
      cardano: "https://coin-images.coingecko.com/coins/images/975/thumb/cardano.png",
      "usd-coin": "https://coin-images.coingecko.com/coins/images/6319/thumb/USDC.png",
    });
  });
});
