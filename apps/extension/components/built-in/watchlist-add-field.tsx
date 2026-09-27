import { Plus } from "lucide-react";
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HUD_PAGE_FOOTER_RESERVE_PX } from "../../lib/hud-layout";
import { resolvePrivilegedFetchUserMessage } from "../../lib/privileged-fetch-user-message";
import { resolveSearchSuggestionsPlacement } from "../../lib/resolve-search-suggestions-placement";
import { useDebouncedCallback } from "../../lib/use-debounced-callback";
import { PanelTip as HudTip } from "../panel-sdk";

type TSuggestionsPanelState = "closed" | "loading" | "open" | "empty" | "error";

interface ISuggestionsPanelLayout {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export interface IWatchlistSearchHit {
  symbol: string;
  name: string;
}

export interface IWatchlistAddFieldLabels {
  placeholder: string;
  inputAriaLabel: string;
  listAriaLabel: string;
  submitAriaLabel: string;
  submitTip: string;
  searching: string;
  searchFailed: string;
  /** Shown instead of the field once the watchlist is full. */
  full: string;
}

/** Search-as-you-type add row shared by the Crypto and Stocks watchlists. */
export function WatchlistAddField<THit extends IWatchlistSearchHit>({
  existingIds,
  atLimit,
  minQueryLength,
  debounceMs,
  labels,
  hitId,
  searchHits,
  onAddHit,
  renderHitIcon,
  resolveFreeformHit,
}: {
  existingIds: ReadonlySet<string>;
  atLimit: boolean;
  minQueryLength: number;
  debounceMs: number;
  labels: IWatchlistAddFieldLabels;
  hitId: (hit: THit) => string;
  /** Must be referentially stable (module-level function). */
  searchHits: (query: string, signal: AbortSignal) => Promise<THit[]>;
  onAddHit: (hit: THit) => void;
  renderHitIcon?: (hit: THit) => React.ReactNode;
  /** Lets Enter add exactly what was typed when search has no (or not yet any) match for it. */
  resolveFreeformHit?: (query: string) => THit | null;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<THit[]>([]);
  const [panelState, setPanelState] = useState<TSuggestionsPanelState>("closed");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [panelLayout, setPanelLayout] = useState<ISuggestionsPanelLayout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const listId = useId();

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
        const items = await searchHits(q, ac.signal);
        if (ac.signal.aborted) return;
        const filtered = items.filter((hit) => !existingIds.has(hitId(hit)));
        setHits(filtered);
        setPanelState(filtered.length > 0 ? "open" : "empty");
        syncPanelLayout();
      } catch (error: unknown) {
        if (ac.signal.aborted) return;
        const raw = error instanceof Error ? error.message : labels.searchFailed;
        const { userMessage } = resolvePrivilegedFetchUserMessage(raw);
        setSearchError(userMessage);
        setHits([]);
        setPanelState("error");
        syncPanelLayout();
      }
    },
    [existingIds, hitId, labels.searchFailed, searchHits, syncPanelLayout],
  );

  const debouncedFetch = useDebouncedCallback((q: string) => {
    void loadHits(q);
  }, debounceMs);

  useEffect(() => {
    if (atLimit) {
      debouncedFetch.cancel();
      abortRef.current?.abort();
      clearSuggestions();
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < minQueryLength) {
      debouncedFetch.cancel();
      abortRef.current?.abort();
      clearSuggestions();
      return;
    }
    debouncedFetch.call(trimmed);
  }, [query, atLimit, minQueryLength, debouncedFetch, clearSuggestions]);

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
    (hit: THit) => {
      debouncedFetch.cancel();
      abortRef.current?.abort();
      onAddHit(hit);
      setQuery("");
      clearSuggestions();
    },
    [clearSuggestions, debouncedFetch, onAddHit],
  );

  const resolveHit = useCallback((): THit | null => {
    if (activeIndex >= 0 && activeIndex < hits.length) return hits[activeIndex] ?? null;
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return null;
    const exact = hits.find((hit) => hit.symbol === trimmed);
    if (exact) return exact;
    // A company name ("apple") should take the top match, not become a bogus ticker.
    if (hits[0]) return hits[0];
    const freeform = resolveFreeformHit?.(trimmed) ?? null;
    return freeform && !existingIds.has(hitId(freeform)) ? freeform : null;
  }, [activeIndex, existingIds, hitId, hits, query, resolveFreeformHit]);

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
            aria-label={labels.listAriaLabel}
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
                {labels.searching}
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
                  <li key={hitId(hit)} role="presentation">
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
                      {renderHitIcon?.(hit)}
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
      <p className="muted mt-3 border-t border-border pt-2 text-xs leading-snug">{labels.full}</p>
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
          placeholder={labels.placeholder}
          className="w-full pl-36"
          aria-label={labels.inputAriaLabel}
        />
      </div>
      <HudTip tip={labels.submitTip}>
        <button
          type="submit"
          className="btn primary icon-only shrink-0"
          aria-label={labels.submitAriaLabel}
        >
          <Plus size={20} strokeWidth={2} aria-hidden />
        </button>
      </HudTip>
      {suggestionsPanel}
    </form>
  );
}
