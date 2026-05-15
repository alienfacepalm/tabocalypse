import { describe, expect, it } from "vitest";

import { bytesPerSecondToMbps } from "./run-cloudflare-speed-test";

describe("bytesPerSecondToMbps", () => {
  it("maps 125000 B/s to 1.0 Mbps", () => {
    expect(bytesPerSecondToMbps(125_000)).toBeCloseTo(1, 5);
  });

  it("returns 0 for zero throughput", () => {
    expect(bytesPerSecondToMbps(0)).toBe(0);
  });
});
