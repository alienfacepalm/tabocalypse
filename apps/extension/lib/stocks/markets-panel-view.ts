/** Title toggle in the Crypto panel; the two lists are mutually exclusive. */
export const MARKETS_PANEL_VIEWS = ["stocks", "crypto"] as const;

export type TMarketsPanelView = (typeof MARKETS_PANEL_VIEWS)[number];

export function coerceMarketsPanelView(
  raw: unknown,
  fallback: TMarketsPanelView,
): TMarketsPanelView {
  return raw === "stocks" || raw === "crypto" ? raw : fallback;
}

export function marketsPanelViewLabel(view: TMarketsPanelView): string {
  return view === "stocks" ? "Stocks" : "Crypto";
}
