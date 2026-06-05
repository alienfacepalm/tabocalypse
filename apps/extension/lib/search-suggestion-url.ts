import type { TSearchEngine } from "./search-engine-options";

const SEARCH_SUGGESTION_ACCEPT = "application/json, text/javascript, */*; q=0.1";

function coerceJsonArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (value == null || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const indexes = Object.keys(record)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b));
  if (indexes.length === 0) return null;
  return indexes.map((key) => record[key]);
}

function extractSuggestionStrings(items: unknown[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed.length > 0) out.push(trimmed);
  }
  return out;
}

/** Build the live suggestion URL for the user's chosen search engine. */
export function buildSearchSuggestionsUrl(engine: TSearchEngine, query: string): string {
  const q = encodeURIComponent(query.trim());
  switch (engine) {
    case "ddg":
      return `https://duckduckgo.com/ac/?q=${q}&type=list`;
    case "google":
      return `https://suggestqueries.google.com/complete/search?client=firefox&q=${q}`;
    case "bing":
      return `https://api.bing.com/osjson.aspx?query=${q}`;
    default: {
      const _exhaustive: never = engine;
      return _exhaustive;
    }
  }
}

/**
 * Parse provider JSON payloads shaped like `["query", ["suggestion", …], …]`.
 * Used by DuckDuckGo, Google suggestqueries, and Bing osjson.
 */
export function parseSearchSuggestionsPayload(data: unknown): string[] {
  if (typeof data === "string") {
    return parseSearchSuggestionsFromText(data);
  }

  const root = coerceJsonArray(data);
  if (!root || root.length < 2) return [];
  const suggestions = coerceJsonArray(root[1]);
  if (!suggestions) return [];
  return extractSuggestionStrings(suggestions);
}

/** Parse a provider response body (JSON text) into suggestion strings. */
export function parseSearchSuggestionsFromText(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];
  try {
    return parseSearchSuggestionsPayload(JSON.parse(trimmed) as unknown);
  } catch {
    return [];
  }
}

/** True when the response body looks like a provider JSON array (not an HTML block page). */
export function isSearchSuggestionResponseText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("[");
}

/** Parse suggestion text, or null when the body is not a provider JSON array. */
export function tryParseSearchSuggestionsFromText(text: string): string[] | null {
  if (!isSearchSuggestionResponseText(text)) return null;
  return parseSearchSuggestionsFromText(text);
}

export function searchSuggestionFetchInit(
  signal?: AbortSignal,
  headers?: Record<string, string>,
): RequestInit {
  return {
    signal,
    credentials: "omit",
    cache: "no-store",
    headers: {
      Accept: SEARCH_SUGGESTION_ACCEPT,
      ...headers,
    },
  };
}
