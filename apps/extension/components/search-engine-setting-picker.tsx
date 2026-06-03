import React from "react";
import {
  SEARCH_ENGINE_LABELS,
  SEARCH_ENGINE_ORDER,
  type TSearchEngine,
} from "../lib/search-engine-options";

function DuckDuckGoMark(): React.JSX.Element {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#DE5833" />
      <ellipse cx="12" cy="13.5" rx="5.5" ry="4.5" fill="#fff" />
      <circle cx="15.2" cy="11.5" r="1.15" fill="#0c1609" />
      <ellipse cx="9.5" cy="15.5" rx="2.2" ry="1.1" fill="#F9A825" />
    </svg>
  );
}

function GoogleMark(): React.JSX.Element {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

function BingMark(): React.JSX.Element {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#008373"
        d="M5 4h7.2c3.5 0 6.3 2.5 6.3 5.6 0 2.2-1.2 4-3.1 5v.1l4.6 5.3H15l-3.8-4.4V15H5V4Z"
      />
      <path
        fill="#00BCF2"
        d="M5 15h6.2c1.8 0 3.1 1.2 3.1 2.8 0 1.7-1.3 2.9-3.1 2.9H5V15Z"
        opacity="0.95"
      />
    </svg>
  );
}

const SEARCH_ENGINE_MARKS: Record<TSearchEngine, () => React.JSX.Element> = {
  ddg: DuckDuckGoMark,
  google: GoogleMark,
  bing: BingMark,
};

export function SearchEngineSettingPicker({
  value,
  onChange,
}: {
  value: TSearchEngine;
  onChange: (engine: TSearchEngine) => void;
}): React.JSX.Element {
  return (
    <div>
      <p className="muted sm mb-2 m-0">
        Classic search and Assist on the HUD open this provider in a new tab.
      </p>
      <div className="row wrap">
        {SEARCH_ENGINE_ORDER.map((engine) => {
          const Mark = SEARCH_ENGINE_MARKS[engine];
          const selected = value === engine;
          return (
            <button
              key={engine}
              type="button"
              aria-pressed={selected}
              className={selected ? "btn primary has-icon" : "btn has-icon"}
              onClick={() => onChange(engine)}
            >
              <Mark />
              <span>{SEARCH_ENGINE_LABELS[engine]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
