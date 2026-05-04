import { describe, expect, it } from "vitest";

import { computeScaledDimensions, estimateDataUrlBytes } from "./compress-background-image";

describe("estimateDataUrlBytes", () => {
  it("counts base64 payload after comma", () => {
    // "AA==" decodes to one byte
    expect(estimateDataUrlBytes("data:image/png;base64,AA==")).toBe(1);
    // "AAAA" -> 3 bytes
    expect(estimateDataUrlBytes("data:image/png;base64,AAAA")).toBe(3);
  });

  it("handles no comma as raw length", () => {
    expect(estimateDataUrlBytes("not-a-data-url")).toBeGreaterThan(0);
  });
});

describe("computeScaledDimensions", () => {
  it("returns original size when within max edge", () => {
    expect(computeScaledDimensions(800, 600, 1920)).toEqual({ width: 800, height: 600 });
  });

  it("scales down preserving aspect when larger than max edge", () => {
    expect(computeScaledDimensions(4000, 2000, 2000)).toEqual({ width: 2000, height: 1000 });
    expect(computeScaledDimensions(1000, 4000, 2000)).toEqual({ width: 500, height: 2000 });
  });

  it("never returns zero dimensions", () => {
    expect(computeScaledDimensions(1, 1, 1)).toEqual({ width: 1, height: 1 });
  });
});
