import { Plus } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CRYPTO_SEARCH_DEBOUNCE_MS,
  fetchCryptoSearchHits,
  MIN_CRYPTO_SEARCH_QUERY_LENGTH,
  type ICryptoSearchHit,
} from "../../lib/crypto/fetch-crypto-search";
import { withResolvedCryptoCoinIcon } from "../../lib/crypto/crypto-coin-icon-url";
import type { ICryptoWatchlistEntry } from "../../lib/crypto/crypto-watchlist";
import { MAX_CRYPTO_WATCHLIST } from "../../lib/crypto/crypto-watchlist";
import { HUD_PAGE_FOOTER_RESERVE_PX } from "../../lib/hud-layout";
import { resolvePrivilegedFetchUserMessage } from "../../lib/privileged-fetch-user-message";
import { resolveSearchSuggestionsPlacement } from "../../lib/resolve-search-suggestions-placement";
import { useDebouncedCallback } from "../../lib/use-debounced-callback";
import { PanelTip as HudTip } from "../panel-sdk";
import { CryptoCoinIcon } from "./crypto-coin-icon";

type TSuggestionsPanelState = "closed" | "loading" | "open" | "empty" | "error";

interface ISuggestionsPanelLayout {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function CryptoWatchlistAddField({
  watchlist,
  onAdd,
}: {
  watchlist: readonly ICryptoWatchlistEntry[];
  onAdd: (entry: ICryptoWatchlistEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ICryptoSearchHit[]>([]);
  const [panelState, setPanelState] = useState<TSuggestionsPanelState>("closed");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [panelLayout, setPanelLayout] = useState<ISuggestionsPanelLayout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const atLimit = watchlist.length >= MAX_CRYPTO_WATCHLIST;
  const existingIds = useMemo(() => new Set(watchlist.map((e) => e.coinId)), [watchlist]);

  const clearSuggestions = useCallback(() => {
    setHits([]);
    setPanelState("closed");
    setActiveIndex(-1);
    setSearchError(null);
    setPanelLayout(null);
  }, []);

  const syncPanelLayout = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const panelHeightPx = panelRef.current?.getBoundingClientRect().height ?? 0;
    const placement = resolveSearchSuggestionsPlacement({
      anchorRect: rect,
      panelHeightPx,
      viewportWidthPx: window.innerWidth,
      viewportHeightPx: window.innerHeight,
      bottomInsetPx: HUD_PAGE_FOOTER_RESERVE_PX,
    });
    setPanelLayout({
      top: placement.topPx,
      left: placement.leftPx,
      width: placement.widthPx,
      maxHeight: placement.maxHeightPx,
    });
  }, []);

  const loadHits = useCallback(
    async (q: string) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setPanelState("loading");
      setHits([]);
      setActiveIndex(-1);
      setSearchError(null);
      syncPanelLayout();
      try {
        const items = await fetchCryptoSearchHits(q, ac.signal);
        if (ac.signal.aborted) return;
        const filtered = items.filter((hit) => !existingIds.has(hit.coinId));
        setHits(filtered);
        setPanelState(filtered.length > 0 ? "open" : "empty");
        syncPanelLayout();
      } catch (error: unknown) {
        if (ac.signal.aborted) return;
        const raw = error instanceof Error ? error.message : "Could not search coins";
        const { userMessage } = resolvePrivilegedFetchUserMessage(raw);
        setSearchError(userMessage);
        setHits([]);
        setPanelState("error");
        syncPanelLayout();
      }
    },
    [existingIds, syncPanelLayout],
  );

  const debouncedFetch = useDebouncedCallback((q: string) => {
    void loadHits(q);
  }, CRYPTO_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (atLimit) {
      debouncedFetch.cancel();
      abortRef.current?.abort();
      clearSuggestions();
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < MIN_CRYPTO_SEARCH_QUERY_LENGTH) {
      debouncedFetch.cancel();
      abortRef.current?.abort();
      clearSuggestions();
      return;
    }
    debouncedFetch.call(trimmed);
  }, [query, atLimit, debouncedFetch, clearSuggestions]);

  useEffect(
    () => () => {
      debouncedFetch.cancel();
      abortRef.current?.abort();
    },
    [debouncedFetch],
  );

  const panelVisible =
    panelState === "loading" ||
    panelState === "open" ||
    panelState === "empty" ||
    panelState === "error";

  useLayoutEffect(() => {
    if (!panelVisible) return;
    syncPanelLayout();
    const onLayout = (): void => {
      syncPanelLayout();
    };
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [panelVisible, syncPanelLayout, hits.length, panelState]);

  const commitHit = useCallback(
    (hit: ICryptoSearchHit) => {
      onAdd(
        withResolvedCryptoCoinIcon({
          coinId: hit.coinId,
          symbol: hit.symbol,
          ...(hit.iconUrl ? { iconUrl: hit.iconUrl } : {}),
        }),
      );
      setQuery("");
      clearSuggestions();
    },
    [clearSuggestions, onAdd],
  );

  const resolveHit = useCallback((): ICryptoSearchHit | null => {
    if (activeIndex >= 0 && activeIndex < hits.length) return hits[activeIndex] ?? null;
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return null;
    return hits.find((hit) => hit.symbol === trimmed) ?? hits[0] ?? null;
  }, [activeIndex, hits, query]);

  const submit = useCallback(() => {
    const hit = resolveHit();
    if (!hit) return;
    commitHit(hit);
  }, [commitHit, resolveHit]);

  const activeDescendantId =
    activeIndex >= 0 && activeIndex < hits.length ? `${listId}-option-${activeIndex}` : undefined;

  const suggestionsPanel =
    panelVisible && panelLayout
      ? createPortal(
          <ul
            ref={panelRef}
            id={listId}
            role="listbox"
            aria-label="CoinGecko coin matches"
            className="search-suggestions"
            style={{
              top: panelLayout.top,
              left: panelLayout.left,
              width: panelLayout.width,
              maxHeight: panelLayout.maxHeight,
            }}
          >
            {panelState === "loading" ? (
              <li className="search-suggestion-status" role="presentation">
                Searching coins…
              </li>
            ) : null}
            {panelState === "empty" ? (
              <li className="search-suggestion-status" role="presentation">
                No matches for this query
              </li>
            ) : null}
            {panelState === "error" && searchError ? (
              <li className="search-suggestion-status" role="presentation">
                {searchError}
              </li>
            ) : null}
            {panelState === "open"
              ? hits.map((hit, index) => (
                  <li key={hit.coinId} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className="search-suggestion flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => {
                        commitHit(hit);
                      }}
                    >
                      <CryptoCoinIcon
                        entry={{
                          coinId: hit.coinId,
                          symbol: hit.symbol,
                          iconUrl: hit.iconUrl,
                        }}
                        size="sm"
                      />
                      <span className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                        {hit.symbol}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-muted">{hit.name}</span>
                    </button>
                  </li>
                ))
              : null}
          </ul>,
          document.body,
        )
      : null;

  if (atLimit) {
    return (
      <p className="muted mt-3 border-t border-border pt-2 text-xs leading-snug">
        Watchlist full ({MAX_CRYPTO_WATCHLIST} coins). Remove one to add another.
      </p>
    );
  }

  return (
    <form
      className="row mt-3 shrink-0 border-t border-border pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div ref={anchorRef} className="search-field-anchor relative min-w-0 flex-1 basis-0">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-sans text-xs text-accent">
          USER_LOG@TAB:&gt;
        </span>
        <input
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={panelState === "open"}
          aria-busy={panelState === "loading"}
          aria-controls={listId}
          aria-activedescendant={activeDescendantId}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              if (hits.length === 0) return;
              e.preventDefault();
              setPanelState("open");
              setActiveIndex((prev) => (prev < hits.length - 1 ? prev + 1 : 0));
              return;
            }
            if (e.key === "ArrowUp") {
              if (hits.length === 0) return;
              e.preventDefault();
              setPanelState("open");
              setActiveIndex((prev) => (prev > 0 ? prev - 1 : hits.length - 1));
              return;
            }
            if (e.key === "Escape") {
              if (!panelVisible) return;
              e.preventDefault();
              clearSuggestions();
              return;
            }
            if (e.key === "Enter" && panelState === "open" && activeIndex >= 0) {
              e.preventDefault();
              const hit = hits[activeIndex];
              if (hit) commitHit(hit);
            }
          }}
          onBlur={(e) => {
            const next = e.relatedTarget;
            if (next instanceof Node && panelRef.current?.contains(next)) return;
            window.setTimeout(() => {
              clearSuggestions();
            }, 150);
          }}
          placeholder="Add a coin by name or symbol"
          className="w-full pl-36"
          aria-label="Add coin to watchlist"
        />
      </div>
      <HudTip tip="Add the highlighted coin match to your watchlist">
        <button type="submit" className="btn primary icon-only shrink-0" aria-label="Add coin">
          <Plus size={20} strokeWidth={2} aria-hidden />
        </button>
      </HudTip>
      {suggestionsPanel}
    </form>
  );
}
