import browser from "webextension-polyfill";
import { Search } from "lucide-react";
import React, { useState } from "react";
import type { ISettings } from "../lib/settings";
import { HudTip } from "./hud-tip";

const ENGINES: Record<ISettings["searchEngine"], (q: string) => string> = {
  ddg: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
};

export function SearchWidget({
  engine,
  variant = "card",
}: {
  engine: ISettings["searchEngine"];
  variant?: "card" | "header";
}) {
  const [q, setQ] = useState("");
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
          placeholder={`What useless trivia are we looking up now? (${engine})`}
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
      <h3>Search</h3>
      {form}
    </section>
  );
}
