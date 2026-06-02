import browser from "webextension-polyfill";
import { Search, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  formatSearchFieldPlaceholder,
  pickSearchPlaceholderLeadForHumorRank,
  searchPlaceholderHumorRank,
} from "../../lib/search-placeholder-leads";
import { buildSearchAssistUrl, buildWebSearchUrl } from "../../lib/search-assist-urls";
import type { ISettings, THumorIntensity } from "../../lib/settings";
import { HudPanelTitle } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";

const SEARCH_ENGINE_LABELS: Record<ISettings["searchEngine"], string> = {
  ddg: "DuckDuckGo",
  google: "Google",
  bing: "Bing",
};

/** User-facing names for the assist destination (not raw URL paths). */
const SEARCH_ASSIST_DESTINATION_LABELS: Record<ISettings["searchEngine"], string> = {
  ddg: "Duck.ai",
  google: "Google AI in Search",
  bing: "Bing Copilot Search",
};

export function SearchWidget({
  engine,
  assistActive,
  onAssistActiveChange,
  humorEnabled,
  humorIntensity,
  variant = "card",
}: {
  engine: ISettings["searchEngine"];
  assistActive: boolean;
  onAssistActiveChange: (active: boolean) => void;
  humorEnabled: boolean;
  humorIntensity: THumorIntensity;
  variant?: "card" | "header";
}) {
  const [q, setQ] = useState("");
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

  const goSearch = () => {
    const t = q.trim();
    if (!t) return;
    openInNewTab(buildWebSearchUrl(engine, t));
    setQ("");
  };

  const goAssist = () => {
    const t = q.trim();
    if (!t) return;
    openInNewTab(buildSearchAssistUrl(engine, t));
    setQ("");
  };

  const submit = () => {
    if (assistActive) goAssist();
    else goSearch();
  };

  const assistDest = SEARCH_ASSIST_DESTINATION_LABELS[engine];

  const form = (
    <form
      className="row w-full min-w-0"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="relative min-w-0 flex-1 basis-0">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-sans text-xs text-accent">
          USER_LOG@TAB:&gt;
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
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
              if (assistActive) goAssist();
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
              if (!assistActive) goSearch();
              else onAssistActiveChange(false);
            }}
          >
            <Search size={20} strokeWidth={2} aria-hidden />
          </button>
        </HudTip>
      </div>
    </form>
  );

  if (variant === "header") return <div className="header-search">{form}</div>;

  return (
    <section className="card">
      <HudPanelTitle>Search</HudPanelTitle>
      {form}
    </section>
  );
}
