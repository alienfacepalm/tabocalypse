import React, { useId } from "react";
import {
  BYO_AI_PROVIDER_LABELS,
  BYO_AI_PROVIDER_ORDER,
  matchByoAiProviderPreset,
  type TByoAiProviderPreset,
} from "../lib/byo-ai-provider-options";

function OpenAiMark(): React.JSX.Element {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#10A37F" />
      <path
        fill="#fff"
        d="M12 5.5c-1.9 0-3.4 1.5-3.4 3.4 0 .7.2 1.3.6 1.9l-1.1 3.2 3.2-1.1c.5.3 1.1.5 1.7.5 1.9 0 3.4-1.5 3.4-3.4S13.9 5.5 12 5.5Zm0 5.6c-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2 2.2 1 2.2 2.2-1 2.2-2.2 2.2Z"
      />
    </svg>
  );
}

function GeminiMark(): React.JSX.Element {
  const gradientId = useId();
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9B72CB" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M12 2.5c.6 3.4 2.8 5.6 6.2 6.2-3.4.6-5.6 2.8-6.2 6.2-.6-3.4-2.8-5.6-6.2-6.2 3.4-.6 5.6-2.8 6.2-6.2Z"
      />
    </svg>
  );
}

const BYO_AI_PROVIDER_MARKS: Record<TByoAiProviderPreset, () => React.JSX.Element> = {
  openai: OpenAiMark,
  gemini: GeminiMark,
};

export function ByoAiProviderToggle({
  baseUrl,
  model,
  onSelectPreset,
  compact = false,
}: {
  baseUrl: string;
  model: string;
  onSelectPreset: (preset: TByoAiProviderPreset) => void;
  compact?: boolean;
}): React.JSX.Element {
  const activePreset = matchByoAiProviderPreset(baseUrl, model);

  return (
    <div className={compact ? "row wrap gap-1" : "row wrap"} role="group" aria-label="AI provider">
      {BYO_AI_PROVIDER_ORDER.map((id) => {
        const Mark = BYO_AI_PROVIDER_MARKS[id];
        const selected = activePreset === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            className={
              selected
                ? compact
                  ? "btn primary has-icon sm"
                  : "btn primary has-icon"
                : compact
                  ? "btn has-icon sm"
                  : "btn has-icon"
            }
            onClick={() => onSelectPreset(id)}
          >
            <Mark />
            <span>{BYO_AI_PROVIDER_LABELS[id]}</span>
          </button>
        );
      })}
    </div>
  );
}
