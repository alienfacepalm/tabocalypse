import type { TSearchEngine } from "./search-engine-options";
import {
  isPrivilegedFetchBackgroundUnavailableError,
  privilegedExtensionFetchText,
} from "./privileged-extension-fetch";
import {
  buildSearchSuggestionsUrl,
  parseSearchSuggestionsPayload,
  tryParseSearchSuggestionsFromText,
} from "./search-suggestion-url";

/** Minimum trimmed query length before calling a provider suggestion endpoint. */
export const MIN_SEARCH_SUGGESTION_QUERY_LENGTH = 2;

const SEARCH_SUGGESTION_HEADERS: Record<string, string> = {
  Accept: "application/json, text/javascript, */*; q=0.1",
};

const SEARCH_SUGGESTIONS_RETRY_MS = 200;

function isRetriablePrivilegedFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return isPrivilegedFetchBackgroundUnavailableError(error.message);
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
  });
}

async function fetchSearchSuggestionsOnce(
  engine: TSearchEngine,
  query: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const url = buildSearchSuggestionsUrl(engine, query);
  const text = await privilegedExtensionFetchText(url, signal, SEARCH_SUGGESTION_HEADERS);
  if (signal?.aborted) return [];
  return tryParseSearchSuggestionsFromText(text) ?? [];
}

/**
 * Fetch live search suggestions from the configured provider.
 * Always uses the background service worker (host_permissions) — never in-page fetch,
 * which hits CORS on Bing/Google/DDG from chrome-extension:// origins (Chrome and Edge).
 */
export async function fetchSearchSuggestions(
  engine: TSearchEngine,
  query: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_SEARCH_SUGGESTION_QUERY_LENGTH) return [];

  try {
    return await fetchSearchSuggestionsOnce(engine, trimmed, signal);
  } catch (firstError) {
    if (signal?.aborted) return [];
    if (firstError instanceof DOMException && firstError.name === "AbortError") return [];
    if (!isRetriablePrivilegedFetchError(firstError)) return [];

    try {
      await sleep(SEARCH_SUGGESTIONS_RETRY_MS, signal);
      return await fetchSearchSuggestionsOnce(engine, trimmed, signal);
    } catch (retryError) {
      if (signal?.aborted) return [];
      if (retryError instanceof DOMException && retryError.name === "AbortError") return [];
      return [];
    }
  }
}

export { buildSearchSuggestionsUrl, parseSearchSuggestionsPayload };
