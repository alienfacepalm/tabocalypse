import browser from "webextension-polyfill";
import { Search, Sparkles } from "lucide-react";
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
  fetchSearchSuggestions,
  MIN_SEARCH_SUGGESTION_QUERY_LENGTH,
} from "../../lib/fetch-search-suggestions";
import {
  formatSearchFieldPlaceholder,
  pickSearchPlaceholderLeadForHumorRank,
  searchPlaceholderHumorRank,
} from "../../lib/search-placeholder-leads";
import { buildSearchAssistUrl, buildWebSearchUrl } from "../../lib/search-assist-urls";
import {
  SEARCH_ASSIST_DESTINATION_LABELS,
  SEARCH_ENGINE_LABELS,
} from "../../lib/search-engine-options";
import type { ISettings, THumorIntensity } from "../../lib/settings";
import { useDebouncedCallback } from "../../lib/use-debounced-callback";
import { HudPanelTitle } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";

const SEARCH_SUGGESTIONS_DEBOUNCE_MS = 300;

type TSuggestionsPanelState = "closed" | "loading" | "open" | "empty";

interface ISuggestionsPanelLayout {
  top: number;
  left: number;
  width: number;
}

export function SearchWidget({
  engine,
  assistActive,
  onAssistActiveChange,
  humorEnabled,
  humorIntensity,
  humorBannerLine,
  variant = "card",
}: {
  engine: ISettings["searchEngine"];
  assistActive: boolean;
  onAssistActiveChange: (active: boolean) => void;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  /** Snark overlay above the field when Settings > Widgets > Humor banner is on. */
  humorBannerLine?: string | null;
  variant?: "card" | "header";
}) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [panelState, setPanelState] = useState<TSuggestionsPanelState>("closed");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panelLayout, setPanelLayout] = useState<ISuggestionsPanelLayout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const humorRank = searchPlaceholderHumorRank(humorEnabled, humorIntensity);
  const placeholderLead = useMemo(
    () => pickSearchPlaceholderLeadForHumorRank(humorRank),
    [humorRank],
  );
  const placeholder = formatSearchFieldPlaceholder(
    placeholderLead,
    assistActive,
    SEARCH_ENGINE_LABELS[engine],
    SEARCH_ASSIST_DESTINATION_LABELS[engine],
  );

  const openInNewTab = (url: string) => {
    if (browser.tabs?.create) {
      void browser.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setPanelState("closed");
    setActiveIndex(-1);
    setPanelLayout(null);
  }, []);

  const syncPanelLayout = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPanelLayout({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const loadSuggestions = useCallback(
    async (eng: ISettings["searchEngine"], query: string) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setPanelState("loading");
      setSuggestions([]);
      setActiveIndex(-1);
      syncPanelLayout();
      const items = await fetchSearchSuggestions(eng, query, ac.signal);
      if (ac.signal.aborted) return;
      setSuggestions(items);
      setPanelState(items.length > 0 ? "open" : "empty");
      syncPanelLayout();
    },
    [syncPanelLayout],
  );

  const debouncedFetch = useDebouncedCallback((eng: ISettings["searchEngine"], query: string) => {
    void loadSuggestions(eng, query);
  }, SEARCH_SUGGESTIONS_DEBOUNCE_MS);

  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < MIN_SEARCH_SUGGESTION_QUERY_LENGTH) {
      debouncedFetch.cancel();
      abortRef.current?.abort();
      clearSuggestions();
      return;
    }
    debouncedFetch.call(engine, trimmed);
  }, [q, engine, debouncedFetch, clearSuggestions]);

  useEffect(
    () => () => {
      debouncedFetch.cancel();
      abortRef.current?.abort();
    },
    [debouncedFetch],
  );

  const panelVisible = panelState === "loading" || panelState === "open" || panelState === "empty";

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
  }, [panelVisible, syncPanelLayout, suggestions.length, panelState]);

  const resolveQuery = useCallback(
    (override?: string) => {
      const fromList =
        activeIndex >= 0 && activeIndex < suggestions.length ? suggestions[activeIndex] : undefined;
      return (override ?? fromList ?? q).trim();
    },
    [activeIndex, q, suggestions],
  );

  const runSearch = useCallback(
    (query: string) => {
      const t = query.trim();
      if (!t) return;
      openInNewTab(buildWebSearchUrl(engine, t));
      setQ("");
      clearSuggestions();
    },
    [clearSuggestions, engine],
  );

  const runAssist = useCallback(
    (query: string) => {
      const t = query.trim();
      if (!t) return;
      openInNewTab(buildSearchAssistUrl(engine, t));
      setQ("");
      clearSuggestions();
    },
    [clearSuggestions, engine],
  );

  const submit = useCallback(
    (override?: string) => {
      const t = resolveQuery(override);
      if (!t) return;
      if (assistActive) runAssist(t);
      else runSearch(t);
    },
    [assistActive, resolveQuery, runAssist, runSearch],
  );

  const assistDest = SEARCH_ASSIST_DESTINATION_LABELS[engine];
  const activeDescendantId =
    activeIndex >= 0 && activeIndex < suggestions.length
      ? `${listId}-option-${activeIndex}`
      : undefined;

  const suggestionsPanel =
    panelVisible && panelLayout
      ? createPortal(
          <ul
            ref={panelRef}
            id={listId}
            role="listbox"
            aria-label={`Suggestions from ${SEARCH_ENGINE_LABELS[engine]}`}
            className="search-suggestions"
            style={{
              top: panelLayout.top,
              left: panelLayout.left,
              width: panelLayout.width,
            }}
          >
            {panelState === "loading" ? (
              <li className="search-suggestion-status" role="presentation">
                Fetching suggestions…
              </li>
            ) : null}
            {panelState === "empty" ? (
              <li className="search-suggestion-status" role="presentation">
                No suggestions for this query
              </li>
            ) : null}
            {panelState === "open"
              ? suggestions.map((suggestion, index) => (
                  <li key={`${suggestion}-${index}`} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className="search-suggestion"
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => {
                        submit(suggestion);
                      }}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))
              : null}
          </ul>,
          document.body,
        )
      : null;

  const form = (
    <form
      className="row w-full min-w-0"
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
          value={q}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={panelState === "open"}
          aria-busy={panelState === "loading"}
          aria-controls={listId}
          aria-activedescendant={activeDescendantId}
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              if (suggestions.length === 0) return;
              e.preventDefault();
              setPanelState("open");
              setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
              return;
            }
            if (e.key === "ArrowUp") {
              if (suggestions.length === 0) return;
              e.preventDefault();
              setPanelState("open");
              setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
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
              submit(suggestions[activeIndex]);
            }
          }}
          onBlur={(e) => {
            const next = e.relatedTarget;
            if (next instanceof Node && panelRef.current?.contains(next)) return;
            window.setTimeout(() => {
              clearSuggestions();
            }, 150);
          }}
          placeholder={placeholder}
          className="w-full pl-36"
          aria-label="Search query"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2" role="group" aria-label="Search mode">
        <HudTip
          tip={
            assistActive
              ? `AI search on — opens ${assistDest} when you press Enter or click again. Uses your browser session only.`
              : `Switch to AI search (${assistDest}). Uses your browser session only — Tabocalypse does not use API keys for this.`
          }
        >
          <button
            type="button"
            className={assistActive ? "btn primary icon-only" : "btn ghost icon-only"}
            aria-pressed={assistActive}
            aria-label={
              assistActive
                ? `AI search on — open ${assistDest} with this query`
                : `Switch to AI search (${assistDest})`
            }
            onClick={() => {
              if (assistActive) submit();
              else onAssistActiveChange(true);
            }}
          >
            <Sparkles size={20} strokeWidth={2} aria-hidden />
          </button>
        </HudTip>
        <HudTip
          tip={
            assistActive
              ? "Switch to classic web search on your chosen engine"
              : "Web search on — runs on your chosen engine when you press Enter or click again"
          }
        >
          <button
            type="button"
            className={assistActive ? "btn ghost icon-only" : "btn primary icon-only"}
            aria-pressed={!assistActive}
            aria-label={
              assistActive
                ? "Switch to web search"
                : `Web search on — search with ${SEARCH_ENGINE_LABELS[engine]}`
            }
            onClick={() => {
              if (!assistActive) submit();
              else onAssistActiveChange(false);
            }}
          >
            <Search size={20} strokeWidth={2} aria-hidden />
          </button>
        </HudTip>
      </div>
      {suggestionsPanel}
    </form>
  );

  if (variant === "header") {
    return (
      <div className="header-search">
        {humorBannerLine ? (
          <p className="humor-banner-snark" role="note">
            {humorBannerLine}
          </p>
        ) : null}
        {form}
      </div>
    );
  }

  return (
    <section className="card">
      <HudPanelTitle>Search</HudPanelTitle>
      {form}
    </section>
  );
}
