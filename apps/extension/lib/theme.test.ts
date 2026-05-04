import { describe, expect, it } from "vitest";
import {
  coerceThemeHex,
  coerceThemeMode,
  coerceThemePalette,
  DEFAULT_THEME_CUSTOM_ACCENT,
  resolveThemeCssVars,
  THEME_MODE_LABELS,
  THEME_PALETTE_LABELS,
  THEME_MODES,
  THEME_PALETTES,
  THEME_PRESET_PALETTES,
  themeGradientStops,
} from "./theme";

const defaultCustom = {
  accent: DEFAULT_THEME_CUSTOM_ACCENT,
  accent2: "#ff00ff",
};

describe("THEME_*_LABELS", () => {
  it("defines a non-empty label for every mode", () => {
    for (const mode of THEME_MODES) {
      expect(THEME_MODE_LABELS[mode]?.trim().length).toBeGreaterThan(0);
    }
  });

  it("defines a non-empty label for every palette including custom", () => {
    for (const palette of THEME_PALETTES) {
      expect(THEME_PALETTE_LABELS[palette]?.trim().length).toBeGreaterThan(0);
    }
  });

  it("lists every preset in THEME_PALETTES before custom", () => {
    expect(THEME_PALETTES[THEME_PALETTES.length - 1]).toBe("custom");
    for (const p of THEME_PRESET_PALETTES) {
      expect(THEME_PALETTES).toContain(p);
    }
  });
});

describe("resolveThemeCssVars", () => {
  it("merges dark neutrals with glitch accents", () => {
    const v = resolveThemeCssVars("dark", "glitch", defaultCustom);
    expect(v["--color-bg"]).toBe("#050505");
    expect(v["--color-accent"]).toBe("#39ff14");
    expect(v["--color-accent2"]).toBe("#ff00ff");
  });

  it("uses light neutrals when mode is light", () => {
    const v = resolveThemeCssVars("light", "ocean", defaultCustom);
    expect(v["--color-bg"]).toBe("#e8e8e4");
    expect(v["--color-accent"]).toBe("#22d3ee");
  });

  it("uses custom hex pair when palette is custom", () => {
    const v = resolveThemeCssVars("dark", "custom", {
      accent: "#ff0000",
      accent2: "#0000ff",
    });
    expect(v["--color-accent"]).toBe("#ff0000");
    expect(v["--color-accent2"]).toBe("#0000ff");
    expect(v["--color-accent3"]?.startsWith("#")).toBe(true);
  });
});

describe("themeGradientStops", () => {
  it("returns darker stops for dark mode", () => {
    expect(themeGradientStops("dark").mid).toContain("#");
    expect(themeGradientStops("light").mid).not.toBe(themeGradientStops("dark").mid);
  });
});

describe("coerceThemeMode", () => {
  it("accepts dark and light only", () => {
    expect(coerceThemeMode("light", "dark")).toBe("light");
    expect(coerceThemeMode("dark", "light")).toBe("dark");
    expect(coerceThemeMode("bogus", "light")).toBe("light");
  });
});

describe("coerceThemePalette", () => {
  it("falls back on invalid values", () => {
    expect(coerceThemePalette("ocean", "glitch")).toBe("ocean");
    expect(coerceThemePalette("forest", "ember")).toBe("forest");
    expect(coerceThemePalette("custom", "ember")).toBe("custom");
    expect(coerceThemePalette("nope", "ember")).toBe("ember");
  });
});

describe("coerceThemeHex", () => {
  it("normalizes 6-digit hex and expands 3-digit", () => {
    expect(coerceThemeHex("#aBcDeF", "#000000")).toBe("#abcdef");
    expect(coerceThemeHex("#f0a", "#000000")).toBe("#ff00aa");
  });

  it("falls back when invalid", () => {
    expect(coerceThemeHex("red", "#010203")).toBe("#010203");
    expect(coerceThemeHex("", "#010203")).toBe("#010203");
  });
});
