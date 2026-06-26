import type { ISettings } from "./settings";

export type TSearchEngine = ISettings["searchEngine"];

/** Fresh installs and invalid stored values resolve to DuckDuckGo. */
export const DEFAULT_SEARCH_ENGINE: TSearchEngine = "ddg";

/** Stable order for settings UI and HUD copy. */
export const SEARCH_ENGINE_ORDER: readonly TSearchEngine[] = [
  DEFAULT_SEARCH_ENGINE,
  "google",
  "bing",
];

export function coerceSearchEngine(
  raw: unknown,
  fallback: TSearchEngine = DEFAULT_SEARCH_ENGINE,
): TSearchEngine {
  if (raw === "ddg" || raw === "google" || raw === "bing") return raw;
  return fallback;
}

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
