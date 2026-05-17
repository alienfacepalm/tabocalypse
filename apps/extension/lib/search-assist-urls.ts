import type { ISettings } from "./settings";

type TSearchEngine = ISettings["searchEngine"];

/** Classic web search URL for the HUD search field (new tab). */
export function buildWebSearchUrl(engine: TSearchEngine, query: string): string {
  const q = encodeURIComponent(query);
  switch (engine) {
    case "ddg":
      return `https://duckduckgo.com/?q=${q}`;
    case "google":
      return `https://www.google.com/search?q=${q}`;
    case "bing":
      return `https://www.bing.com/search?q=${q}`;
    default: {
      const _exhaustive: never = engine;
      return _exhaustive;
    }
  }
}

/**
 * Opens the user’s browser session on a vendor AI / assist surface (no Tabocalypse API keys).
 * Prefill and feature availability depend on the third party.
 */
export function buildSearchAssistUrl(engine: TSearchEngine, query: string): string {
  switch (engine) {
    case "ddg":
      return `https://duckduckgo.com/?q=${encodeURIComponent(`!ai ${query}`)}`;
    case "google":
      return `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=50`;
    case "bing":
      // Bing’s chat path is unreliable as a deep link; Copilot Search is the stable on-Bing AI surface.
      return `https://www.bing.com/copilotsearch?q=${encodeURIComponent(query)}`;
    default: {
      const _exhaustive: never = engine;
      return _exhaustive;
    }
  }
}
