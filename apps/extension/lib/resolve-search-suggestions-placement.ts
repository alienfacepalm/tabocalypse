export type TSearchSuggestionsPlacement = "above" | "below";

/** Matches Tailwind `max-h-64` on `.search-suggestions`. */
export const SEARCH_SUGGESTIONS_MAX_HEIGHT_PX = 256;

export interface ISearchSuggestionsPlacementInput {
  anchorRect: Pick<DOMRect, "top" | "left" | "right" | "bottom" | "width">;
  panelHeightPx: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
  gapPx?: number;
  marginPx?: number;
  /** Bottom viewport inset (e.g. fixed HUD footer). */
  bottomInsetPx?: number;
  maxPanelHeightPx?: number;
}

export interface ISearchSuggestionsPlacementResult {
  placement: TSearchSuggestionsPlacement;
  topPx: number;
  leftPx: number;
  widthPx: number;
  maxHeightPx: number;
}

function clampScalar(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Keeps portaled search suggestion lists on-screen — flips above the field when below the fold. */
export function resolveSearchSuggestionsPlacement(
  input: ISearchSuggestionsPlacementInput,
): ISearchSuggestionsPlacementResult {
  const gap = input.gapPx ?? 4;
  const margin = input.marginPx ?? 8;
  const bottomInset = input.bottomInsetPx ?? 0;
  const maxPanelHeight = input.maxPanelHeightPx ?? SEARCH_SUGGESTIONS_MAX_HEIGHT_PX;
  const anchor = input.anchorRect;
  const vw = input.viewportWidthPx;
  const vh = input.viewportHeightPx;

  const widthPx = anchor.width;
  const maxLeft = Math.max(margin, vw - widthPx - margin);
  const leftPx = clampScalar(anchor.left, margin, maxLeft);

  const spaceBelow = vh - bottomInset - anchor.bottom - gap - margin;
  const spaceAbove = anchor.top - gap - margin;

  const measuredOrEstimate = input.panelHeightPx > 0 ? input.panelHeightPx : 40;
  const neededHeight = Math.min(measuredOrEstimate, maxPanelHeight);

  let placement: TSearchSuggestionsPlacement;
  if (neededHeight <= spaceBelow) {
    placement = "below";
  } else if (neededHeight <= spaceAbove) {
    placement = "above";
  } else if (spaceAbove >= spaceBelow) {
    placement = "above";
  } else {
    placement = "below";
  }

  const maxHeightPx =
    placement === "below"
      ? Math.max(40, Math.min(maxPanelHeight, spaceBelow))
      : Math.max(40, Math.min(maxPanelHeight, spaceAbove));

  const renderedHeight = Math.min(
    input.panelHeightPx > 0 ? input.panelHeightPx : neededHeight,
    maxHeightPx,
  );

  const idealTop = placement === "below" ? anchor.bottom + gap : anchor.top - gap - renderedHeight;

  const minTop = margin;
  const maxTop = Math.max(margin, vh - bottomInset - renderedHeight - margin);
  const topPx = clampScalar(idealTop, minTop, maxTop);

  return { placement, topPx, leftPx, widthPx, maxHeightPx };
}
