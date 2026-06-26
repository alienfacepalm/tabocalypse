import { describe, expect, it } from "vitest";
import { BUILTIN_PACKS, GEN_Z_PACK_ID, UNSUCK_CLASSICS_PACK_ID } from "./builtin-packs";
import { pickDailyLine, resolveHumorBannerLine, type IHumorContext } from "./engine";
import { localizeHumorLine } from "./humor-browser-line";

const genZLines = BUILTIN_PACKS.find((p) => p.id === GEN_Z_PACK_ID)?.lines ?? [];
const unsuckLines = BUILTIN_PACKS.find((p) => p.id === UNSUCK_CLASSICS_PACK_ID)?.lines ?? [];

function localizedLines(lines: readonly string[]): string[] {
  return lines.map((line) => localizeHumorLine(line));
}

function baseCtx(over: Partial<IHumorContext>): IHumorContext {
  return {
    humorEnabled: true,
    humorIntensity: "mild",
    humorBuiltinVoice: "default",
    humorIncludeUnsuckClassics: false,
    enabledBuiltinPackIds: [],
    importedPacks: [],
    myLines: [],
    locale: "en-US",
    ...over,
  };
}

describe("resolveHumorBannerLine", () => {
  it("returns a line when master humor is off but the banner widget is enabled", () => {
    const line = resolveHumorBannerLine(
      baseCtx({
        humorEnabled: false,
        humorIntensity: "off",
        humorBuiltinVoice: "gen_z",
      }),
    );
    expect(line).toBeTruthy();
    expect(genZLines).toBeTruthy();
    expect(localizedLines(genZLines)).toContain(line);
  });

  it("bumps off intensity to mild so the banner still has copy", () => {
    const line = resolveHumorBannerLine(
      baseCtx({
        humorEnabled: true,
        humorIntensity: "off",
        enabledBuiltinPackIds: ["tab_shame"],
      }),
    );
    expect(line).toBeTruthy();
  });
});

describe("pickDailyLine", () => {
  it("uses only Gen-Z built-ins when Gen-Z voice is selected", () => {
    const ctx = baseCtx({
      humorBuiltinVoice: "gen_z",
      enabledBuiltinPackIds: ["office_absurd"],
    });
    const line = pickDailyLine(ctx);
    expect(line).toBeTruthy();
    expect(genZLines).toBeTruthy();
    expect(localizedLines(genZLines)).toContain(line);
  });

  it("ignores Gen-Z voice when default and uses enabled packs", () => {
    const ctx = baseCtx({
      humorBuiltinVoice: "default",
      enabledBuiltinPackIds: ["tab_shame"],
    });
    const line = pickDailyLine(ctx);
    expect(line).toBeTruthy();
    const tabShameLines = BUILTIN_PACKS.find((p) => p.id === "tab_shame")?.lines ?? [];
    expect(localizedLines(tabShameLines)).toContain(line);
  });

  it("pools custom lines with Gen-Z built-ins when Gen-Z voice is on", () => {
    const ctx = baseCtx({
      humorBuiltinVoice: "gen_z",
      enabledBuiltinPackIds: [],
      myLines: ["custom-roast-abc"],
    });
    const line = pickDailyLine(ctx);
    expect(line).toBeTruthy();
    expect([...localizedLines(genZLines), "custom-roast-abc"]).toContain(line);
  });

  it("uses only classic jargon built-ins when that voice is selected", () => {
    const ctx = baseCtx({
      humorBuiltinVoice: "unsuck_classics",
      enabledBuiltinPackIds: ["office_absurd"],
    });
    const line = pickDailyLine(ctx);
    expect(line).toBeTruthy();
    expect(localizedLines(unsuckLines)).toContain(line);
  });

  it("merges classic jargon into Gen-Z rotation when Include Classic jargon is on", () => {
    const ctx = baseCtx({
      humorBuiltinVoice: "gen_z",
      humorIncludeUnsuckClassics: true,
      enabledBuiltinPackIds: ["office_absurd"],
    });
    const line = pickDailyLine(ctx);
    expect(line).toBeTruthy();
    expect([...localizedLines(genZLines), ...localizedLines(unsuckLines)]).toContain(line);
  });

  it("adds classic jargon to default pack mix when Include Classic jargon is on", () => {
    const ctx = baseCtx({
      humorBuiltinVoice: "default",
      humorIncludeUnsuckClassics: true,
      enabledBuiltinPackIds: ["tab_shame"],
    });
    const line = pickDailyLine(ctx);
    expect(line).toBeTruthy();
    const tabShameLines = BUILTIN_PACKS.find((p) => p.id === "tab_shame")?.lines ?? [];
    expect([...localizedLines(tabShameLines), ...localizedLines(unsuckLines)]).toContain(line);
  });
});
