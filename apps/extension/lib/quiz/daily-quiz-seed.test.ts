import { describe, expect, it } from "vitest";
import { fnv1a32, mulberry32, seededShuffle } from "./daily-quiz-seed";

const TEN = Array.from({ length: 10 }, (_, i) => `q${i}`);

describe("fnv1a32", () => {
  it("is stable and differs across inputs", () => {
    expect(fnv1a32("abc")).toBe(fnv1a32("abc"));
    expect(fnv1a32("abc")).not.toBe(fnv1a32("abd"));
  });
});

describe("mulberry32", () => {
  it("yields a deterministic sequence in [0, 1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i += 1) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("seededShuffle", () => {
  it("is deterministic for the same seed", () => {
    expect(seededShuffle(TEN, "seed-a")).toEqual(seededShuffle(TEN, "seed-a"));
  });

  it("changes order for a different seed", () => {
    expect(seededShuffle(TEN, "seed-a")).not.toEqual(seededShuffle(TEN, "seed-b"));
  });

  it("returns a permutation and leaves the input untouched", () => {
    const input = TEN.slice();
    const out = seededShuffle(input, "seed-a");
    expect(out.slice().sort()).toEqual(TEN.slice().sort());
    expect(input).toEqual(TEN);
    expect(out).not.toBe(input);
  });

  it("handles empty and single-item inputs", () => {
    expect(seededShuffle([], "x")).toEqual([]);
    expect(seededShuffle(["only"], "x")).toEqual(["only"]);
  });
});
