import React from "react";
import type { IImportedPlugin, IPluginWidget } from "@tabocalypse/plugin-sdk";
import { coerceAlarmMetaMessage } from "../lib/alarm-meta-message";
import { faviconUrl } from "../lib/favicon-url";
import { PanelBody as HudPanelBody, PanelTitle as HudPanelTitle } from "./panel-sdk";

function StaticText({ props }: { props: { text: string } }) {
  return <p className="plugin-static">{coerceAlarmMetaMessage(props.text as unknown)}</p>;
}

function RotatingQuotes({ props }: { props: { quotes: string[] } }) {
  const safeQuotes = React.useMemo(
    () =>
      props.quotes
        .map((q) => coerceAlarmMetaMessage(q as unknown).trim())
        .filter((s) => s.length > 0),
    [props.quotes],
  );
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (safeQuotes.length === 0) return undefined;
    const t = window.setInterval(() => setI((x) => (x + 1) % safeQuotes.length), 8000);
    return () => window.clearInterval(t);
  }, [safeQuotes.length]);
  if (!safeQuotes.length) return null;
  return <p className="plugin-quotes">{safeQuotes[i % safeQuotes.length]}</p>;
}

function LinkGrid({ props }: { props: { links: { label: string; url: string }[] } }) {
  return (
    <ul className="link-grid">
      {props.links.map((l, idx) => (
        <li key={idx}>
          <a href={l.url} target="_blank" rel="noreferrer">
            <img src={faviconUrl(l.url)} alt="" width={16} height={16} className="favicon" />
            {coerceAlarmMetaMessage(l.label as unknown)}
          </a>
        </li>
      ))}
    </ul>
  );
}

function OneWidget({ w, debug }: { w: IPluginWidget; debug: boolean }) {
  return (
    <div className="plugin-widget">
      {debug ? <span className="muted sm">{w.type}</span> : null}
      {w.type === "StaticText" ? <StaticText props={w.props as { text: string }} /> : null}
      {w.type === "RotatingQuotes" ? (
        <RotatingQuotes props={w.props as { quotes: string[] }} />
      ) : null}
      {w.type === "LinkGrid" ? (
        <LinkGrid props={w.props as { links: { label: string; url: string }[] }} />
      ) : null}
    </div>
  );
}

export function PluginDeck({ plugins, debug }: { plugins: IImportedPlugin[]; debug: boolean }) {
  const enabled = plugins.filter((p) => p.enabled);
  if (!enabled.length) return null;
  return (
    <div className="plugin-deck-host">
      <div className="plugin-deck-scroll">
        <div className="plugin-deck">
          {enabled.map((p) => (
            <section key={p.id} className="card">
              <HudPanelTitle>{p.name}</HudPanelTitle>
              <HudPanelBody>
                {debug ? <p className="muted sm">id: {p.id}</p> : null}
                {p.widgets.map((w) => (
                  <OneWidget key={w.id} w={w} debug={debug} />
                ))}
              </HudPanelBody>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
