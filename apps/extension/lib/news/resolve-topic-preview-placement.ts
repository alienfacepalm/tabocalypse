export type TTopicPreviewPlacement = "left" | "right" | "top" | "bottom";

export interface ITopicPreviewPlacementInput {
  anchorRect: Pick<DOMRect, "top" | "left" | "right" | "bottom">;
  previewWidthPx: number;
  previewHeightPx: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
  gapPx?: number;
  marginPx?: number;
}

export interface ITopicPreviewPlacementResult {
  placement: TTopicPreviewPlacement;
  topPx: number;
  leftPx: number;
}

function clampScalar(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Picks the side with the least clamping so the preview stays on-screen. */
export function resolveTopicPreviewPlacement(
  input: ITopicPreviewPlacementInput,
): ITopicPreviewPlacementResult {
  const gap = input.gapPx ?? 8;
  const margin = input.marginPx ?? 8;
  const { previewWidthPx: w, previewHeightPx: h } = input;
  const vw = input.viewportWidthPx;
  const vh = input.viewportHeightPx;
  const anchor = input.anchorRect;

  const maxLeft = Math.max(margin, vw - w - margin);
  const maxTop = Math.max(margin, vh - h - margin);

  const candidates: {
    placement: TTopicPreviewPlacement;
    idealLeft: number;
    idealTop: number;
  }[] = [
    { placement: "right", idealLeft: anchor.right + gap, idealTop: anchor.top },
    { placement: "left", idealLeft: anchor.left - gap - w, idealTop: anchor.top },
    { placement: "bottom", idealLeft: anchor.left, idealTop: anchor.bottom + gap },
    { placement: "top", idealLeft: anchor.left, idealTop: anchor.top - gap - h },
  ];

  let best: ITopicPreviewPlacementResult = {
    placement: "right",
    leftPx: clampScalar(anchor.right + gap, margin, maxLeft),
    topPx: clampScalar(anchor.top, margin, maxTop),
  };
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const leftPx = clampScalar(candidate.idealLeft, margin, maxLeft);
    const topPx = clampScalar(candidate.idealTop, margin, maxTop);
    const penalty = Math.abs(leftPx - candidate.idealLeft) + Math.abs(topPx - candidate.idealTop);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = { placement: candidate.placement, leftPx, topPx };
    }
  }

  return best;
}
