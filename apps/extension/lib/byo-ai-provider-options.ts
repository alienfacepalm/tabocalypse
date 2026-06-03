/** OpenAI-compatible BYO AI provider presets (same chat/completions wire format). */

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

export function normalizeByoAiBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function matchByoAiProviderPreset(
  baseUrl: string,
  model: string,
): TByoAiProviderPreset | null {
  const normalizedBase = normalizeByoAiBaseUrl(baseUrl);
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
