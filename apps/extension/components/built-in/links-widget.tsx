import React from "react";
import browser from "webextension-polyfill";
import { coerceAlarmMetaMessage } from "../../lib/alarm-meta-message";
import { faviconUrl } from "../../lib/favicon-url";
import { HudTip } from "../hud-tip";
import { HudPanelBody, HudPanelTitle } from "../hud-panel-drag-context";

export function TopSitesWidget({
  permissionsEpoch,
  onOpenTopSitesSettings,
}: {
  permissionsEpoch: number;
  onOpenTopSitesSettings: () => void;
}) {
  const [sites, setSites] = React.useState<{ url?: string; title?: string }[]>([]);
  const [err, setErr] = React.useState<"permission" | null>(null);

  React.useEffect(() => {
    setErr(null);
    setSites([]);
    const api = browser.topSites;
    if (!api?.get) {
      setErr("permission");
      return;
    }
    void api
      .get()
      .then((s) => setSites(s.slice(0, 12)))
      .catch(() => setErr("permission"));
  }, [permissionsEpoch]);

  if (err)
    return (
      <section className="card">
        <HudPanelTitle>Top sites</HudPanelTitle>
        <HudPanelBody>
          <p className="err">
            Top sites needs browser permission. Open{" "}
            <HudTip tip="Open Settings and jump to Optional permissions">
              <button
                type="button"
                className="linkish p-0"
                onClick={onOpenTopSitesSettings}
                aria-label="Open Settings and jump to Optional permissions to enable Top sites"
              >
                Settings &gt; Optional permissions
              </button>
            </HudTip>{" "}
            and enable Top sites.
          </p>
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

export function BookmarksWidget({
  permissionsEpoch,
  onOpenBookmarksSettings,
}: {
  permissionsEpoch: number;
  onOpenBookmarksSettings: () => void;
}) {
  const [marks, setMarks] = React.useState<{ id: string; title?: string; url?: string }[]>([]);
  const [err, setErr] = React.useState<"permission" | null>(null);

  React.useEffect(() => {
    setErr(null);
    setMarks([]);
    const api = browser.bookmarks;
    if (!api?.getRecent) {
      setErr("permission");
      return;
    }
    void api
      .getRecent(16)
      .then(setMarks)
      .catch(() => setErr("permission"));
  }, [permissionsEpoch]);

  if (err)
    return (
      <section className="card">
        <HudPanelTitle>Bookmarks</HudPanelTitle>
        <HudPanelBody>
          <p className="err">
            Bookmarks need browser permission. Open{" "}
            <HudTip tip="Open Settings and jump to Optional permissions">
              <button
                type="button"
                className="linkish p-0"
                onClick={onOpenBookmarksSettings}
                aria-label="Open Settings and jump to Optional permissions to enable Bookmarks"
              >
                Settings &gt; Optional permissions
              </button>
            </HudTip>{" "}
            and enable Bookmarks.
          </p>
        </HudPanelBody>
      </section>
    );

  return (
    <section className="card">
      <HudPanelTitle>Bookmarks</HudPanelTitle>
      <HudPanelBody>
        <ul className="link-grid">
          {marks.map((b) => {
            const label = coerceAlarmMetaMessage(b.title as unknown) || b.url || "";
            return (
              <li key={b.id}>
                <HudTip tip={label} wrapClassName="block min-w-0 w-full">
                  <a href={b.url} target="_blank" rel="noreferrer">
                    <img
                      src={faviconUrl(b.url ?? "")}
                      alt=""
                      width={16}
                      height={16}
                      className="favicon"
                    />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </a>
                </HudTip>
              </li>
            );
          })}
        </ul>
      </HudPanelBody>
    </section>
  );
}
