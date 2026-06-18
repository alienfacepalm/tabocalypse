import { describe, expect, it } from "vitest";
import {
  isAllowedCryptoCoinIconUrl,
  normalizeCryptoCoinIconUrl,
  resolveCryptoCoinIconUrl,
} from "./crypto-coin-icon-url";

describe("crypto-coin-icon-url", () => {
  it("allows CoinGecko CDN thumbs only", () => {
    expect(
      isAllowedCryptoCoinIconUrl("https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png"),
    ).toBe(true);
    expect(
      isAllowedCryptoCoinIconUrl(
        "https://coin-images.coingecko.com/coins/images/975/thumb/cardano.png",
      ),
    ).toBe(true);
    expect(isAllowedCryptoCoinIconUrl("https://evil.example/coin.png")).toBe(false);
  });

  it("normalizes valid icon URLs", () => {
    expect(
      normalizeCryptoCoinIconUrl(
        " https://assets.coingecko.com/coins/images/279/thumb/ethereum.png ",
      ),
    ).toBe("https://assets.coingecko.com/coins/images/279/thumb/ethereum.png");
    expect(
      normalizeCryptoCoinIconUrl(
        "https://coin-images.coingecko.com/coins/images/6319/thumb/USDC.png",
      ),
    ).toBe("https://coin-images.coingecko.com/coins/images/6319/thumb/USDC.png");
    expect(normalizeCryptoCoinIconUrl("not-a-url")).toBeUndefined();
  });

  it("resolves stored or default icons by coin id", () => {
    expect(
      resolveCryptoCoinIconUrl({
        coinId: "bitcoin",
      }),
    ).toContain("assets.coingecko.com");
    expect(
      resolveCryptoCoinIconUrl({
        coinId: "solana",
        iconUrl: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
      }),
    ).toContain("solana.png");
  });
});
