import React from "react";
import {
  BYO_AI_PROVIDER_PRESETS,
  matchByoAiProviderPreset,
  type TByoAiProviderPreset,
} from "../lib/byo-ai-provider-options";
import { ByoAiProviderToggle } from "./byo-ai-provider-toggle";

export function ByoAiProviderSettingPicker({
  baseUrl,
  model,
  onSelectPreset,
}: {
  baseUrl: string;
  model: string;
  onSelectPreset: (preset: TByoAiProviderPreset) => void;
}): React.JSX.Element {
  const activePreset = matchByoAiProviderPreset(baseUrl, model);

  return (
    <div>
      <p className="muted sm mb-2 m-0">
        Presets use OpenAI-compatible chat endpoints. You can still edit the base URL and model for
        other providers.
      </p>
      <ByoAiProviderToggle baseUrl={baseUrl} model={model} onSelectPreset={onSelectPreset} />
      {activePreset === "gemini" ? (
        <p className="muted sm mb-0 mt-2">
          {BYO_AI_PROVIDER_PRESETS.gemini.apiKeyHint}. Gemini is wired through Google&apos;s
          OpenAI-compatible chat endpoint — same request shape as OpenAI.
        </p>
      ) : null}
    </div>
  );
}
