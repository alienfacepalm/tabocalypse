import { describe, expect, it } from "vitest";
import {
  BYO_AI_PROVIDER_LABELS,
  BYO_AI_PROVIDER_ORDER,
  BYO_AI_PROVIDER_PRESETS,
  byoAiApiKeyForPreset,
  matchByoAiProviderPreset,
  normalizeByoAiBaseUrl,
} from "./byo-ai-provider-options";
import { buildOpenAiChatCompletionsUrl } from "./openai-compatible-chat";

describe("byo ai provider options", () => {
  it("covers every preset with labels and endpoints", () => {
    for (const id of BYO_AI_PROVIDER_ORDER) {
      expect(BYO_AI_PROVIDER_LABELS[id]?.trim().length).toBeGreaterThan(0);
      expect(BYO_AI_PROVIDER_PRESETS[id].baseUrl.startsWith("https://")).toBe(true);
      expect(BYO_AI_PROVIDER_PRESETS[id].model.trim().length).toBeGreaterThan(0);
      expect(BYO_AI_PROVIDER_PRESETS[id].apiKeyHint.trim().length).toBeGreaterThan(0);
    }
    expect(BYO_AI_PROVIDER_ORDER).toHaveLength(2);
  });

  it("normalizes trailing slashes on base URLs", () => {
    expect(normalizeByoAiBaseUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1");
  });

  it("matches known presets regardless of trailing slash", () => {
    const gemini = BYO_AI_PROVIDER_PRESETS.gemini;
    expect(matchByoAiProviderPreset(`${gemini.baseUrl}/`, gemini.model)).toBe("gemini");
    expect(matchByoAiProviderPreset(gemini.baseUrl, "other-model")).toBeNull();
  });

  it("builds Gemini chat completions on the OpenAI-compatible path", () => {
    expect(buildOpenAiChatCompletionsUrl(BYO_AI_PROVIDER_PRESETS.gemini.baseUrl)).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    );
  });

  it("resolves API keys per preset", () => {
    expect(byoAiApiKeyForPreset("openai", { openai: "sk-openai", gemini: "sk-gemini" })).toBe(
      "sk-openai",
    );
    expect(byoAiApiKeyForPreset("gemini", { openai: "sk-openai", gemini: "sk-gemini" })).toBe(
      "sk-gemini",
    );
    expect(byoAiApiKeyForPreset(null, { openai: " sk ", gemini: "" })).toBe("sk");
  });
});
