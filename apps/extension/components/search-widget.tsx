import browser from "webextension-polyfill";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  pickSearchPlaceholderLeadForHumorRank,
  searchPlaceholderHumorRank,
} from "../lib/search-placeholder-leads";
import type { ISettings, THumorIntensity } from "../lib/settings";
import { HudPanelTitle } from "./hud-panel-drag-context";
import { HudTip } from "./hud-tip";

const ENGINES: Record<ISettings["searchEngine"], (q: string) => string> = {
  ddg: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
};

const SEARCH_ENGINE_LABELS: Record<ISettings["searchEngine"], string> = {
  ddg: "DuckDuckGo",
  google: "Google",
  bing: "Bing",
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
  const go = () => {
    const t = q.trim();
    if (!t) return;
    const url = ENGINES[engine](t);
    if (browser.tabs?.create) {
      void browser.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setQ("");
  };

  const form = (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <div className="relative min-w-0 flex-1">
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
      <HudTip tip="Run search in a new tab with your chosen engine">
        <button type="submit" className="btn primary icon-only" aria-label="Search">
          <Search size={20} strokeWidth={2} aria-hidden />
        </button>
      </HudTip>
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
