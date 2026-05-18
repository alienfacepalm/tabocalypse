import browser from "webextension-polyfill";
import { Search, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
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
  humorEnabled,
  humorIntensity,
  variant = "card",
}: {
  engine: ISettings["searchEngine"];
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
  const placeholder = `${placeholderLead}? (${SEARCH_ENGINE_LABELS[engine]})`;
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

  const assistDest = SEARCH_ASSIST_DESTINATION_LABELS[engine];

  const form = (
    <form
      className="row w-full min-w-0"
      onSubmit={(e) => {
        e.preventDefault();
        goSearch();
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
      <div className="flex shrink-0 items-center gap-2">
        <HudTip
          tip={`Open ${assistDest} in a new tab with this query. Uses your browser session only — Tabocalypse does not send this to our servers or use API keys for it.`}
        >
          <button
            type="button"
            className="btn ghost icon-only"
            aria-label={`Open ${assistDest} with this query`}
            onClick={goAssist}
          >
            <Sparkles size={20} strokeWidth={2} aria-hidden />
          </button>
        </HudTip>
        <HudTip tip="Run search in a new tab with your chosen engine">
          <button type="submit" className="btn primary icon-only" aria-label="Search">
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
