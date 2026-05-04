import React from "react";
import browser from "webextension-polyfill";

export function TopSitesWidget() {
  const [sites, setSites] = React.useState<{ url?: string; title?: string }[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const api = browser.topSites;
    if (!api?.get) {
      setErr("Enable Top sites in settings (permission).");
      return;
    }
    void api
      .get()
      .then((s) => setSites(s.slice(0, 12)))
      .catch(() => setErr("Enable Top sites in settings (permission)."));
  }, []);

  if (err)
    return (
      <section className="card">
        <h3>Top sites</h3>
        <p className="err">{err}</p>
      </section>
    );

  return (
    <section className="card">
      <h3>Top sites</h3>
      <ul className="link-grid">
        {sites.map((s, i) => (
          <li key={i}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title || s.url}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BookmarksWidget() {
  const [marks, setMarks] = React.useState<{ id: string; title?: string; url?: string }[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const api = browser.bookmarks;
    if (!api?.getRecent) {
      setErr("Enable Bookmarks strip in settings (permission).");
      return;
    }
    void api
      .getRecent(16)
      .then(setMarks)
      .catch(() => setErr("Enable Bookmarks strip in settings (permission)."));
  }, []);

  if (err)
    return (
      <section className="card">
        <h3>Bookmarks</h3>
        <p className="err">{err}</p>
      </section>
    );

  return (
    <section className="card">
      <h3>Bookmarks</h3>
      <ul className="link-grid">
        {marks.map((b) => (
          <li key={b.id}>
            <a href={b.url} target="_blank" rel="noreferrer">
              {b.title || b.url}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
