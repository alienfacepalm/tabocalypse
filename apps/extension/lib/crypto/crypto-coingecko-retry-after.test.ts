import { describe, expect, it } from "vitest";
import { parseRetryAfterDelayMs } from "./crypto-coingecko-retry-after";

describe("parseRetryAfterDelayMs", () => {
  it("returns milliseconds for decimal integer seconds", () => {
    expect(parseRetryAfterDelayMs("120")).toBe(120_000);
    expect(parseRetryAfterDelayMs(" 60 ")).toBe(60_000);
    expect(parseRetryAfterDelayMs("0")).toBe(0);
  });

  it("returns undefined for invalid values", () => {
    expect(parseRetryAfterDelayMs(null)).toBeUndefined();
    expect(parseRetryAfterDelayMs("")).toBeUndefined();
    expect(parseRetryAfterDelayMs("abc")).toBeUndefined();
    expect(parseRetryAfterDelayMs("-5")).toBeUndefined();
  });
});
