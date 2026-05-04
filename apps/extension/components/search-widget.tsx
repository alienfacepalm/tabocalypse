import browser from "webextension-polyfill";
import { Search } from "lucide-react";
import React, { useState } from "react";
import type { Settings } from "../lib/settings";

const ENGINES: Record<Settings["searchEngine"], (q: string) => string> = {
  ddg: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
};

export function SearchWidget({ engine }: { engine: Settings["searchEngine"] }) {
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
  return (
    <section className="card">
      <h3>Search</h3>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search (${engine})`}
          style={{ flex: 1 }}
          aria-label="Search query"
        />
        <button type="submit" className="btn primary icon-only" aria-label="Search" title="Search">
          <Search size={20} strokeWidth={2} aria-hidden />
        </button>
      </form>
    </section>
  );
}
