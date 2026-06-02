import { describe, expect, it } from "vitest";
import {
  adaptHudAccentForThemeMode,
  coerceThemeHex,
  coerceThemeMode,
  coerceThemePalette,
  DEFAULT_THEME_CUSTOM_ACCENT,
  ensureAccent2ReadableInLightMode,
  ensureAccentReadableInDarkMode,
  ensureAccentReadableInLightMode,
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
    expect(v["--color-accent2"]).toBe("#6366f1");
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

  it("caps only very pale custom accents in light mode", () => {
    const pale = "#e8f2fa";
    const v = resolveThemeCssVars("light", "custom", {
      accent: pale,
      accent2: "#6b8f4a",
    });
    const parseL = (hex: string): number => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return (Math.max(r, g, b) + Math.min(r, g, b)) / (2 * 255);
    };
    expect(parseL(v["--color-accent"]!)).toBeLessThanOrEqual(0.79);
    expect(v["--color-accent2"]).toBe("#6b8f4a");
    expect(v["--color-on-accent"]).toBe("#0a0a0a");
  });

  it("floors dim custom accents in dark mode and picks light on-accent text", () => {
    const v = resolveThemeCssVars("dark", "custom", {
      accent: "#2a3318",
      accent2: "#ff00ff",
    });
    const parseL = (hex: string): number => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return (Math.max(r, g, b) + Math.min(r, g, b)) / (2 * 255);
    };
    expect(parseL(v["--color-accent"]!)).toBeGreaterThanOrEqual(0.56);
    expect(v["--color-on-accent"]).toBe("#f2f2ec");
  });

  it("leaves dark custom accents unchanged in light mode", () => {
    const v = resolveThemeCssVars("light", "custom", {
      accent: "#15803d",
      accent2: "#7c2d12",
    });
    expect(v["--color-accent"]).toBe("#15803d");
    expect(v["--color-accent2"]).toBe("#7c2d12");
  });

  it("darkens mid-light secondary accents in light mode for all palettes", () => {
    const parseL = (hex: string): number => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return (Math.max(r, g, b) + Math.min(r, g, b)) / (2 * 255);
    };
    const paleSecondary = "#ddb090";
    const v = resolveThemeCssVars("light", "custom", {
      accent: "#15803d",
      accent2: paleSecondary,
    });
    expect(parseL(v["--color-accent2"]!)).toBeLessThan(parseL(paleSecondary));
    expect(parseL(v["--color-accent2"]!)).toBeLessThanOrEqual(0.61);
  });
});

describe("ensureAccent2ReadableInLightMode", () => {
  it("is idempotent and darkens mid-light secondary accents for ghost buttons", () => {
    const peach = "#ddb090";
    const once = ensureAccent2ReadableInLightMode(peach);
    expect(once).toMatch(/^#[0-9a-f]{6}$/);
    expect(once).not.toBe(peach);
    expect(ensureAccent2ReadableInLightMode(once)).toBe(once);
    expect(ensureAccent2ReadableInLightMode("#6b8f4a")).toBe("#6b8f4a");
  });
});

describe("ensureAccentReadableInLightMode", () => {
  it("is idempotent and only caps very pale samples", () => {
    const once = ensureAccentReadableInLightMode("#e8f2fa");
    expect(once).toMatch(/^#[0-9a-f]{6}$/);
    expect(ensureAccentReadableInLightMode(once)).toBe(once);
    expect(ensureAccentReadableInLightMode("#6b8f4a")).toBe("#6b8f4a");
  });
});

describe("ensureAccentReadableInDarkMode", () => {
  it("is idempotent and floors dim samples for HUD text", () => {
    const once = ensureAccentReadableInDarkMode("#3d4a28");
    expect(once).toMatch(/^#[0-9a-f]{6}$/);
    expect(ensureAccentReadableInDarkMode(once)).toBe(once);
    expect(ensureAccentReadableInDarkMode("#39ff14")).toBe("#39ff14");
  });
});

describe("adaptHudAccentForThemeMode", () => {
  it("leaves mid-tone accents unchanged", () => {
    expect(adaptHudAccentForThemeMode("#6b8f4a", "light")).toBe("#6b8f4a");
    expect(adaptHudAccentForThemeMode("#39ff14", "dark")).toBe("#39ff14");
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

  it("strips alpha from 8-digit hex (color input)", () => {
    expect(coerceThemeHex("#AabbCcFf", "#000000")).toBe("#aabbcc");
  });

  it("falls back when invalid", () => {
    expect(coerceThemeHex("red", "#010203")).toBe("#010203");
    expect(coerceThemeHex("", "#010203")).toBe("#010203");
  });
});
