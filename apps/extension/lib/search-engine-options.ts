import type { ISettings } from "./settings";

export type TSearchEngine = ISettings["searchEngine"];

/** Stable order for settings UI and HUD copy. */
export const SEARCH_ENGINE_ORDER: readonly TSearchEngine[] = ["ddg", "google", "bing"];

export const SEARCH_ENGINE_LABELS: Record<TSearchEngine, string> = {
  ddg: "DuckDuckGo",
  google: "Google",
  bing: "Bing",
};

/** User-facing names for the assist destination (not raw URL paths). */
export const SEARCH_ASSIST_DESTINATION_LABELS: Record<TSearchEngine, string> = {
  ddg: "Duck.ai",
  google: "Google AI in Search",
  bing: "Bing Copilot Search",
};
