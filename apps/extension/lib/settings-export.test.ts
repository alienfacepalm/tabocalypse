import { describe, expect, it } from "vitest";
import type { ISettings } from "./settings";
import { exportSettingsJsonText, settingsForJsonExport } from "./settings-export";

/** Minimal settings stub — avoid importing `defaultSettings` (pulls webextension-polyfill). */
function sampleSettings(overrides: Partial<ISettings> = {}): ISettings {
  return {
    openaiApiKey: "",
    geminiApiKey: "",
    balancedNewsApiKey: "",
    steamWebApiKey: "",
    ...overrides,
  } as ISettings;
}

describe("settingsForJsonExport", () => {
  it("redacts API keys by default", () => {
    const s = sampleSettings({
      openaiApiKey: "sk-secret",
      geminiApiKey: "gem-secret",
      balancedNewsApiKey: "news-secret",
      steamWebApiKey: "steam-secret",
    });
    const exported = settingsForJsonExport(s);
    expect(exported.openaiApiKey).toBe("");
    expect(exported.geminiApiKey).toBe("");
    expect(exported.balancedNewsApiKey).toBe("");
    expect(exported.steamWebApiKey).toBe("");
    expect(s.openaiApiKey).toBe("sk-secret");
  });

  it("keeps secrets when includeSecrets is true", () => {
    const s = sampleSettings({ openaiApiKey: "sk-secret" });
    expect(settingsForJsonExport(s, { includeSecrets: true }).openaiApiKey).toBe("sk-secret");
  });

  it("stringifies redacted JSON", () => {
    const s = sampleSettings({ openaiApiKey: "sk-secret" });
    const text = exportSettingsJsonText(s);
    expect(text).not.toContain("sk-secret");
    expect(text).toContain('"openaiApiKey": ""');
  });
});
