import { describe, expect, it } from "vitest";
import { BUILTIN_PACKS, GEN_Z_PACK_ID } from "./builtin-packs";
import { pickDailyLine, type IHumorContext } from "./engine";

const genZLines = BUILTIN_PACKS.find((p) => p.id === GEN_Z_PACK_ID)?.lines ?? [];

function baseCtx(over: Partial<IHumorContext>): IHumorContext {
  return {
    humorEnabled: true,
    humorIntensity: "mild",
    humorGenZMode: false,
    enabledBuiltinPackIds: [],
    importedPacks: [],
    myLines: [],
    locale: "en-US",
    ...over,
  };
}

describe("pickDailyLine", () => {
  it("uses only Gen-Z built-ins when Gen-Z mode is on", () => {
    const ctx = baseCtx({
      humorGenZMode: true,
      enabledBuiltinPackIds: ["office_absurd"],
    });
    const line = pickDailyLine(ctx);
    expect(line).toBeTruthy();
    expect(genZLines).toContain(line);
  });

  it("ignores Gen-Z pack toggles when Gen-Z mode is off", () => {
    const ctx = baseCtx({
      humorGenZMode: false,
      enabledBuiltinPackIds: ["tab_shame"],
    });
    const line = pickDailyLine(ctx);
    expect(line).toBeTruthy();
    const tabShameLines = BUILTIN_PACKS.find((p) => p.id === "tab_shame")?.lines ?? [];
    expect(tabShameLines).toContain(line);
  });

  it("pools custom lines with Gen-Z built-ins when Gen-Z mode is on", () => {
    const ctx = baseCtx({
      humorGenZMode: true,
      enabledBuiltinPackIds: [],
      myLines: ["custom-roast-abc"],
    });
    const line = pickDailyLine(ctx);
    expect(line).toBeTruthy();
    expect([...genZLines, "custom-roast-abc"]).toContain(line);
  });
});
