import { describe, expect, it } from "vitest";
import { coerceFqnBiasLabel, mapBiasToPerspective } from "./map-bias-perspective";

describe("mapBiasToPerspective", () => {
  it("maps five-point bias labels into left, center, or right", () => {
    expect(mapBiasToPerspective("left")).toBe("left");
    expect(mapBiasToPerspective("left-center")).toBe("left");
    expect(mapBiasToPerspective("center")).toBe("center");
    expect(mapBiasToPerspective("right-center")).toBe("right");
    expect(mapBiasToPerspective("right")).toBe("right");
    expect(mapBiasToPerspective("unknown")).toBeNull();
  });
});

describe("coerceFqnBiasLabel", () => {
  it("normalizes known bias strings", () => {
    expect(coerceFqnBiasLabel("Left-Center")).toBe("left-center");
    expect(coerceFqnBiasLabel("garbage")).toBe("unknown");
  });
});
