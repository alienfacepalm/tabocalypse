import { describe, expect, it } from "vitest";
import {
  invalidCryptoCoingeckoMarketRowResponse,
  parseCryptoCoingeckoMarketRowMessage,
  TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW,
} from "./crypto-coingecko-message";

describe("parseCryptoCoingeckoMarketRowMessage", () => {
  it("accepts default and custom watchlist coins", () => {
    expect(
      parseCryptoCoingeckoMarketRowMessage({
        coinId: "bitcoin",
        ticker: "BTC",
        days: 1,
      }),
    ).toEqual({
      type: TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW,
      coinId: "bitcoin",
      ticker: "BTC",
      days: 1,
    });
    expect(
      parseCryptoCoingeckoMarketRowMessage({
        coinId: "monero",
        ticker: "XMR",
        days: 7,
      }),
    ).toEqual({
      type: TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW,
      coinId: "monero",
      ticker: "XMR",
      days: 7,
    });
  });

  it("rejects invalid coin ids and missing days", () => {
    expect(
      parseCryptoCoingeckoMarketRowMessage({
        coinId: "not valid",
        ticker: "XMR",
        days: 1,
      }),
    ).toBeNull();
    expect(
      parseCryptoCoingeckoMarketRowMessage({
        coinId: "monero",
        ticker: "XMR",
      }),
    ).toBeNull();
  });

  it("returns a structured error when the background rejects a payload", () => {
    expect(invalidCryptoCoingeckoMarketRowResponse()).toEqual({
      ok: false,
      error: "Invalid crypto coin request.",
    });
  });
});
