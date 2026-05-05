import React from "react";
import browser from "webextension-polyfill";
import { coerceAlarmMetaMessage } from "../lib/alarm-meta-message";
import { faviconUrl } from "../lib/favicon-url";
import { HudPanelBody, HudPanelTitle } from "./hud-panel-drag-context";

export function TopSitesWidget({ permissionsEpoch }: { permissionsEpoch: number }) {
  const [sites, setSites] = React.useState<{ url?: string; title?: string }[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    setErr(null);
    setSites([]);
    const api = browser.topSites;
    if (!api?.get) {
      setErr("Enable Top sites in settings (permission).");
      return;
    }
    void api
      .get()
      .then((s) => setSites(s.slice(0, 12)))
      .catch(() => setErr("Enable Top sites in settings (permission)."));
  }, [permissionsEpoch]);

  if (err)
    return (
      <section className="card">
        <HudPanelTitle>Top sites</HudPanelTitle>
        <HudPanelBody>
          <p className="err">{err}</p>
        </HudPanelBody>
      </section>
    );

  return (
    <section className="card">
      <HudPanelTitle>Top sites</HudPanelTitle>
      <HudPanelBody>
        <ul className="link-grid">
          {sites.map((s, i) => (
            <li key={i}>
              <a href={s.url} target="_blank" rel="noreferrer">
                <img
                  src={faviconUrl(s.url ?? "")}
                  alt=""
                  width={16}
                  height={16}
                  className="favicon"
                />
                {coerceAlarmMetaMessage(s.title as unknown) || s.url}
              </a>
            </li>
          ))}
        </ul>
      </HudPanelBody>
    </section>
  );
}

export function BookmarksWidget({ permissionsEpoch }: { permissionsEpoch: number }) {
  const [marks, setMarks] = React.useState<{ id: string; title?: string; url?: string }[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    setErr(null);
    setMarks([]);
    const api = browser.bookmarks;
    if (!api?.getRecent) {
      setErr("Enable Bookmarks strip in settings (permission).");
      return;
    }
    void api
      .getRecent(16)
      .then(setMarks)
      .catch(() => setErr("Enable Bookmarks strip in settings (permission)."));
  }, [permissionsEpoch]);

  if (err)
    return (
      <section className="card">
        <HudPanelTitle>Bookmarks</HudPanelTitle>
        <HudPanelBody>
          <p className="err">{err}</p>
        </HudPanelBody>
      </section>
    );

  return (
    <section className="card">
      <HudPanelTitle>Bookmarks</HudPanelTitle>
      <HudPanelBody>
        <ul className="link-grid">
          {marks.map((b) => (
            <li key={b.id}>
              <a href={b.url} target="_blank" rel="noreferrer">
                <img
                  src={faviconUrl(b.url ?? "")}
                  alt=""
                  width={16}
                  height={16}
                  className="favicon"
                />
                {coerceAlarmMetaMessage(b.title as unknown) || b.url}
              </a>
            </li>
          ))}
        </ul>
      </HudPanelBody>
    </section>
  );
}
