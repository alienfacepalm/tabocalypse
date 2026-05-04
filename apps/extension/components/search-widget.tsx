import browser from "webextension-polyfill";
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
    void browser.tabs.create({ url });
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
        <button type="submit" className="btn primary">
          Go
        </button>
      </form>
    </section>
  );
}
