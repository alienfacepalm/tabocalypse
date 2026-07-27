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
    steamChartsSteamId: "",
    ...overrides,
  } as ISettings;
}

describe("settingsForJsonExport", () => {
  it("redacts API keys and Steam ID by default", () => {
    const s = sampleSettings({
      openaiApiKey: "sk-secret",
      geminiApiKey: "gem-secret",
      balancedNewsApiKey: "news-secret",
      steamWebApiKey: "steam-secret",
      steamChartsSteamId: "76561198025217855",
    });
    const exported = settingsForJsonExport(s);
    expect(exported.openaiApiKey).toBe("");
    expect(exported.geminiApiKey).toBe("");
    expect(exported.balancedNewsApiKey).toBe("");
    expect(exported.steamWebApiKey).toBe("");
    expect(exported.steamChartsSteamId).toBe("");
    expect(s.openaiApiKey).toBe("sk-secret");
    expect(s.steamChartsSteamId).toBe("76561198025217855");
  });

  it("keeps secrets when includeSecrets is true", () => {
    const s = sampleSettings({
      openaiApiKey: "sk-secret",
      steamChartsSteamId: "76561198025217855",
    });
    const full = settingsForJsonExport(s, { includeSecrets: true });
    expect(full.openaiApiKey).toBe("sk-secret");
    expect(full.steamChartsSteamId).toBe("76561198025217855");
  });

  it("stringifies redacted JSON", () => {
    const s = sampleSettings({
      openaiApiKey: "sk-secret",
      steamChartsSteamId: "76561198025217855",
    });
    const text = exportSettingsJsonText(s);
    expect(text).not.toContain("sk-secret");
    expect(text).not.toContain("76561198025217855");
    expect(text).toContain('"openaiApiKey": ""');
  });
});
