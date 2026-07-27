import { describe, expect, it } from "vitest";
import type { ISettings } from "./settings";
import { applyImportedSecretKeys, mergeImportedSecretKey } from "./settings-import-secrets";

describe("mergeImportedSecretKey", () => {
  it("keeps current when imported is empty or missing", () => {
    expect(mergeImportedSecretKey("", "sk-live")).toBe("sk-live");
    expect(mergeImportedSecretKey("   ", "sk-live")).toBe("sk-live");
    expect(mergeImportedSecretKey(undefined, "sk-live")).toBe("sk-live");
  });

  it("uses non-empty imported values", () => {
    expect(mergeImportedSecretKey("sk-new", "sk-live")).toBe("sk-new");
  });
});

describe("applyImportedSecretKeys", () => {
  it("does not wipe keys when re-importing a redacted export", () => {
    const current = {
      openaiApiKey: "sk-live",
      geminiApiKey: "gem-live",
      balancedNewsApiKey: "news-live",
      steamWebApiKey: "steam-live",
      steamChartsSteamId: "76561198025217855",
    } as ISettings;
    const imported = {
      openaiApiKey: "",
      geminiApiKey: "",
      balancedNewsApiKey: "",
      steamWebApiKey: "",
      steamChartsSteamId: "",
    } as Partial<ISettings>;
    const target = { ...current, ...imported } as ISettings;
    const merged = applyImportedSecretKeys(target, imported, current);
    expect(merged.openaiApiKey).toBe("sk-live");
    expect(merged.geminiApiKey).toBe("gem-live");
    expect(merged.balancedNewsApiKey).toBe("news-live");
    expect(merged.steamWebApiKey).toBe("steam-live");
    expect(merged.steamChartsSteamId).toBe("76561198025217855");
  });

  it("applies non-empty imported secrets and keeps others from current", () => {
    const current = {
      openaiApiKey: "sk-live",
      geminiApiKey: "gem-live",
      balancedNewsApiKey: "news-live",
      steamWebApiKey: "steam-live",
      steamChartsSteamId: "76561198025217855",
    } as ISettings;
    const imported = {
      openaiApiKey: "sk-new",
      geminiApiKey: "",
      steamChartsSteamId: "76561198123456789",
    } as Partial<ISettings>;
    const target = { ...current, ...imported } as ISettings;
    const merged = applyImportedSecretKeys(target, imported, current);
    expect(merged.openaiApiKey).toBe("sk-new");
    expect(merged.geminiApiKey).toBe("gem-live");
    expect(merged.steamChartsSteamId).toBe("76561198123456789");
  });
});
