import browser from "webextension-polyfill";
import { Search } from "lucide-react";
import React, { useState } from "react";
import type { ISettings } from "../lib/settings";
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

/** Rotating coy prompts — stable for this widget mount via lazy state below. */
const SEARCH_PLACEHOLDER_LEADS: readonly string[] = [
  "What rabbit hole earns your afternoon",
  "What fact will you forget in five minutes",
  "Summon answers from the hive mind",
  "Type the thing you’d explain badly at a party",
  "What are you pretending is real work right now",
  "The tab bar demands tribute—give it a query",
  "Which lore will you unsolicited-explain tomorrow",
  "Research how long ‘one quick search’ actually takes",
  "What useless trivia validates your fragile ego today",
  "Innocent question → fourteen tabs → sudden dawn",
  "Which wiki walk officially starts… now",
  "What slang are you decoding for ‘research’",
  "Ask the indexed void something unnecessary",
  "Which hyperfixation are we responsibly feeding",
  "Look up the thing you’ll confidently misremember later",
  "What problem gets outsourced to autocomplete today",
  "Recipe, existential doubt, or cursed animal fact—pick your fighter",
  "Decide whether this is procrastination or ‘due diligence’",
  "Peek outside the walled garden—with maximum drama",
  "What will you skim, screenshot, then never revisit",
  "Consult the oracle (it has ads and drama in equal measure)",
  "Which answer do you already know but refuse to admit",
  "Type the question that births twelve follow-ups minimum",
  "What acronym is gatekeeping your entire industry today",
  "Be honest: are you shopping, stalking, or ‘learning’",
  "Which celebrity drama do you need summarized in one tab",
  "What error code are you about to blame on the router",
  "How deep is this stack overflow before you admit defeat",
  "Name the symptom you should probably not Web-MD",
  "What did that song actually say before you misheard it forever",
  "Which country’s flag are you about to misidentify boldly",
  "What’s the canonical order of a franchise you’ll never finish",
  "Who had the worst take this week—let’s validate that",
  "Translate millennial panic into Gen-Alpha vocabulary",
  "Find the exact clip you only half-remember from 2009",
  "What’s the difference between these two almost-identical GPUs",
  "Is it a bug, a feature, or user error—place your bets",
];

function pickSearchPlaceholderLead(): string {
  const i = Math.floor(Math.random() * SEARCH_PLACEHOLDER_LEADS.length);
  return SEARCH_PLACEHOLDER_LEADS[i] ?? SEARCH_PLACEHOLDER_LEADS[0];
}

export function SearchWidget({
  engine,
  variant = "card",
}: {
  engine: ISettings["searchEngine"];
  variant?: "card" | "header";
}) {
  const [q, setQ] = useState("");
  const [placeholderLead] = useState(pickSearchPlaceholderLead);
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
