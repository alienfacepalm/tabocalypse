import { describe, expect, it } from "vitest";
import { resolveSearchSuggestionsPlacement } from "./resolve-search-suggestions-placement";

describe("resolveSearchSuggestionsPlacement", () => {
  it("opens below the anchor when there is room under the fold", () => {
    const result = resolveSearchSuggestionsPlacement({
      anchorRect: { top: 200, left: 40, right: 400, bottom: 240, width: 360 },
      panelHeightPx: 80,
      viewportWidthPx: 1200,
      viewportHeightPx: 800,
    });
    expect(result.placement).toBe("below");
    expect(result.topPx).toBe(244);
    expect(result.leftPx).toBe(40);
    expect(result.widthPx).toBe(360);
  });

  it("flips above when the anchor sits near the bottom of the viewport", () => {
    const result = resolveSearchSuggestionsPlacement({
      anchorRect: { top: 620, left: 40, right: 400, bottom: 660, width: 360 },
      panelHeightPx: 96,
      viewportWidthPx: 1200,
      viewportHeightPx: 700,
      bottomInsetPx: 56,
    });
    expect(result.placement).toBe("above");
    expect(result.topPx).toBe(520);
    expect(result.maxHeightPx).toBeGreaterThan(0);
  });

  it("clamps horizontal position when the anchor is flush with the right edge", () => {
    const result = resolveSearchSuggestionsPlacement({
      anchorRect: { top: 120, left: 1160, right: 1210, bottom: 160, width: 50 },
      panelHeightPx: 120,
      viewportWidthPx: 1200,
      viewportHeightPx: 800,
    });
    expect(result.leftPx).toBe(1142);
    expect(result.leftPx + result.widthPx).toBeLessThanOrEqual(1192);
  });

  it("caps max height to remaining viewport space below the anchor", () => {
    const result = resolveSearchSuggestionsPlacement({
      anchorRect: { top: 592, left: 40, right: 400, bottom: 632, width: 360 },
      panelHeightPx: 80,
      viewportWidthPx: 1200,
      viewportHeightPx: 800,
      bottomInsetPx: 56,
    });
    expect(result.placement).toBe("below");
    expect(result.maxHeightPx).toBe(100);
    expect(result.topPx + result.maxHeightPx).toBeLessThanOrEqual(800 - 56);
  });
});
