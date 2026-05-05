import React from "react";
import type { IImportedPlugin, IPluginWidget } from "@tabocalypse/plugin-sdk";
import { faviconUrl } from "../lib/favicon-url";
import { HudPanelBody, HudPanelTitle } from "./hud-panel-drag-context";

function StaticText({ props }: { props: { text: string } }) {
  return <p className="plugin-static">{props.text}</p>;
}

function RotatingQuotes({ props }: { props: { quotes: string[] } }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = window.setInterval(() => setI((x) => (x + 1) % props.quotes.length), 8000);
    return () => window.clearInterval(t);
  }, [props.quotes.length]);
  if (!props.quotes.length) return null;
  return <p className="plugin-quotes">{props.quotes[i % props.quotes.length]}</p>;
}

function LinkGrid({ props }: { props: { links: { label: string; url: string }[] } }) {
  return (
    <ul className="link-grid">
      {props.links.map((l, idx) => (
        <li key={idx}>
          <a href={l.url} target="_blank" rel="noreferrer">
            <img src={faviconUrl(l.url)} alt="" width={16} height={16} className="favicon" />
            {l.label}
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
