import { describe, expect, it } from "vitest";
import {
  coerceCryptoWatchlist,
  DEFAULT_CRYPTO_WATCHLIST,
  MAX_CRYPTO_WATCHLIST,
  normalizeCryptoWatchlistEntry,
} from "./crypto-watchlist";

describe("crypto watchlist", () => {
  it("normalizes valid entries", () => {
    expect(normalizeCryptoWatchlistEntry({ coinId: " Bitcoin ", symbol: "btc" })).toEqual({
      coinId: "bitcoin",
      symbol: "BTC",
    });
    expect(
      normalizeCryptoWatchlistEntry({
        coinId: "solana",
        symbol: "sol",
        iconUrl: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
      }),
    ).toEqual({
      coinId: "solana",
      symbol: "SOL",
      iconUrl: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
    });
  });

  it("rejects invalid ids and symbols", () => {
    expect(normalizeCryptoWatchlistEntry({ coinId: "", symbol: "BTC" })).toBeNull();
    expect(normalizeCryptoWatchlistEntry({ coinId: "bitcoin", symbol: "" })).toBeNull();
    expect(normalizeCryptoWatchlistEntry({ coinId: "bit coin", symbol: "BTC" })).toBeNull();
  });

  it("falls back to defaults when storage is empty or invalid", () => {
    expect(coerceCryptoWatchlist(undefined)).toEqual([...DEFAULT_CRYPTO_WATCHLIST]);
    expect(coerceCryptoWatchlist([])).toEqual([...DEFAULT_CRYPTO_WATCHLIST]);
    expect(coerceCryptoWatchlist("nope")).toEqual([...DEFAULT_CRYPTO_WATCHLIST]);
  });

  it("fills default icons for legacy entries without iconUrl", () => {
    const out = coerceCryptoWatchlist([{ coinId: "bitcoin", symbol: "BTC" }]);
    expect(out[0]?.iconUrl).toContain("assets.coingecko.com");
  });

  it("dedupes by coin id and caps length", () => {
    const many = Array.from({ length: MAX_CRYPTO_WATCHLIST + 3 }, (_, i) => ({
      coinId: `coin-${i}`,
      symbol: `C${i}`,
    }));
    many.push({ coinId: "coin-1", symbol: "DUP" });
    const out = coerceCryptoWatchlist(many);
    expect(out).toHaveLength(MAX_CRYPTO_WATCHLIST);
    expect(out.some((e) => e.symbol === "DUP")).toBe(false);
  });
});
