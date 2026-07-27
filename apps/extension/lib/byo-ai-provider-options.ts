/** OpenAI-compatible BYO AI provider presets (same chat/completions wire format). */

import { isRateOrQuotaLimitError, RATE_OR_QUOTA_LIMIT_MESSAGE } from "./format-api-error";

export type TByoAiProviderPreset = "openai" | "gemini";

/** Stable order for settings UI. */
export const BYO_AI_PROVIDER_ORDER: readonly TByoAiProviderPreset[] = ["openai", "gemini"];

export const BYO_AI_PROVIDER_LABELS: Record<TByoAiProviderPreset, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
};

export interface IByoAiProviderPreset {
  baseUrl: string;
  model: string;
  /** Short hint for the API key field in settings. */
  apiKeyHint: string;
}

/** Gemini uses Google's OpenAI-compatible layer — not the native generateContent API. */
export const BYO_AI_PROVIDER_PRESETS: Record<TByoAiProviderPreset, IByoAiProviderPreset> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKeyHint: "OpenAI API key",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
    apiKeyHint: "Gemini API key from Google AI Studio",
  },
};

/** Returns a normalized base URL or null when the URL is not HTTPS (guard before permission request). */
export function normalizeByoAiBaseUrl(baseUrl: string): string | null {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed.startsWith("https://")) return null;
  return trimmed;
}

export function matchByoAiProviderPreset(
  baseUrl: string,
  model: string,
): TByoAiProviderPreset | null {
  const normalizedBase = normalizeByoAiBaseUrl(baseUrl);
  if (normalizedBase === null) return null;
  const normalizedModel = model.trim();
  for (const id of BYO_AI_PROVIDER_ORDER) {
    const preset = BYO_AI_PROVIDER_PRESETS[id];
    if (
      normalizeByoAiBaseUrl(preset.baseUrl) === normalizedBase &&
      preset.model === normalizedModel
    ) {
      return id;
    }
  }
  return null;
}

export function byoAiApiKeyForPreset(
  preset: TByoAiProviderPreset | null,
  keys: { openai: string; gemini: string },
): string {
  if (preset === "gemini") return keys.gemini.trim();
  return keys.openai.trim();
}

/** Presets that have an API key saved, excluding the active one when known. */
export function otherByoAiPresetsWithApiKey(
  activePreset: TByoAiProviderPreset | null,
  keys: { openai: string; gemini: string },
): TByoAiProviderPreset[] {
  return BYO_AI_PROVIDER_ORDER.filter((id) => {
    if (activePreset !== null && id === activePreset) return false;
    return byoAiApiKeyForPreset(id, keys).length > 0;
  });
}

function joinProviderLabels(presets: TByoAiProviderPreset[]): string {
  const labels = presets.map((id) => BYO_AI_PROVIDER_LABELS[id]);
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]}`;
}

/** When rate-limited, suggest another configured provider until billing resets. */
export function augmentRateLimitErrorWithAlternateProviders(
  error: string,
  activePreset: TByoAiProviderPreset | null,
  keys: { openai: string; gemini: string },
): string {
  if (!isRateOrQuotaLimitError(error)) return error;
  const alternates = otherByoAiPresetsWithApiKey(activePreset, keys);
  if (alternates.length === 0) return error;
  const names = joinProviderLabels(alternates);
  return `${RATE_OR_QUOTA_LIMIT_MESSAGE} You also have ${names} set up — switch provider above and try again until that account is back in good standing.`;
}
