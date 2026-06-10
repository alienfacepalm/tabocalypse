import { describe, expect, it } from "vitest";
import { resolveTopicPreviewPlacement } from "./resolve-topic-preview-placement";

describe("resolveTopicPreviewPlacement", () => {
  const preview = { previewWidthPx: 320, previewHeightPx: 280 };

  it("prefers placing the preview to the right when space allows", () => {
    const result = resolveTopicPreviewPlacement({
      anchorRect: { top: 120, left: 40, right: 360, bottom: 168 },
      ...preview,
      viewportWidthPx: 1200,
      viewportHeightPx: 800,
    });
    expect(result.placement).toBe("right");
    expect(result.leftPx).toBe(368);
    expect(result.topPx).toBe(120);
  });

  it("places the preview to the left when the right edge is tight", () => {
    const result = resolveTopicPreviewPlacement({
      anchorRect: { top: 120, left: 900, right: 1180, bottom: 168 },
      ...preview,
      viewportWidthPx: 1200,
      viewportHeightPx: 800,
    });
    expect(result.placement).toBe("left");
    expect(result.leftPx).toBe(572);
  });

  it("places the preview below when horizontal sides are too tight", () => {
    const result = resolveTopicPreviewPlacement({
      anchorRect: { top: 40, left: 50, right: 350, bottom: 88 },
      ...preview,
      viewportWidthPx: 400,
      viewportHeightPx: 800,
    });
    expect(result.placement).toBe("bottom");
    expect(result.topPx).toBe(96);
  });

  it("places the preview above when the anchor sits low on the screen", () => {
    const result = resolveTopicPreviewPlacement({
      anchorRect: { top: 620, left: 40, right: 360, bottom: 668 },
      ...preview,
      viewportWidthPx: 1200,
      viewportHeightPx: 700,
    });
    expect(result.placement).toBe("top");
    expect(result.topPx).toBe(332);
  });
});
