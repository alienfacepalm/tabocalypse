import { describe, expect, it } from "vitest";

import {
  bytesPerSecondToMbps,
  medianAfterDiscard,
  medianMbps,
  SPEED_TEST_DISCARD_MEASURE_MS,
  SPEED_TEST_SAMPLE_INTERVAL_MS,
} from "./run-cloudflare-speed-test";

describe("bytesPerSecondToMbps", () => {
  it("maps 125000 B/s to 1.0 Mbps", () => {
    expect(bytesPerSecondToMbps(125_000)).toBeCloseTo(1, 5);
  });

  it("returns 0 for zero throughput", () => {
    expect(bytesPerSecondToMbps(0)).toBe(0);
  });
});

describe("medianMbps", () => {
  it("returns the middle value for an odd-length list", () => {
    expect(medianMbps([10, 50, 30])).toBe(30);
  });

  it("averages the two center values for an even-length list", () => {
    expect(medianMbps([10, 20, 30, 40])).toBe(25);
  });

  it("returns 0 when there are no samples", () => {
    expect(medianMbps([])).toBe(0);
  });
});

describe("medianAfterDiscard", () => {
  it("drops the first second of 250ms samples before taking the median", () => {
    const samples = [5, 5, 5, 5, 100, 100, 100];
    expect(
      medianAfterDiscard(samples, SPEED_TEST_SAMPLE_INTERVAL_MS, SPEED_TEST_DISCARD_MEASURE_MS),
    ).toBe(100);
  });

  it("falls back to all samples when discard would leave none", () => {
    expect(
      medianAfterDiscard([42], SPEED_TEST_SAMPLE_INTERVAL_MS, SPEED_TEST_DISCARD_MEASURE_MS),
    ).toBe(42);
  });
});
