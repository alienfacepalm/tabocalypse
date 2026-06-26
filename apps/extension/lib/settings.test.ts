import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockBrowser, syncGet, syncSet, localGet, localSet } = vi.hoisted(() => {
  const syncGet = vi.fn();
  const syncSet = vi.fn();
  const localGet = vi.fn();
  const localSet = vi.fn();
  const mockBrowser = {
    storage: {
      sync: { get: syncGet, set: syncSet } as {
        get: typeof syncGet;
        set: typeof syncSet;
      } | null,
      local: { get: localGet, set: localSet },
    },
  };
  return { mockBrowser, syncGet, syncSet, localGet, localSet };
});

vi.mock("webextension-polyfill", () => ({
  default: mockBrowser,
}));

const SYNC_KEY = "tabocalypseSync";
const NOTES_SYNC_KEY = "tabocalypseNotes";
const LOCAL_KEY = "tabocalypseLocal";

const {
  loadSettings,
  saveSettings,
  defaultSettings,
  applyPreset,
  applyChaosPresetHumorHarmony,
  applyFocusPresetHarmony,
  coercePreset,
  DEFAULT_WIDGETS,
  DEFAULT_EXPERIMENTAL_FEATURES,
  mergeWidgets,
  coerceWidgetsByDisplay,
  hasWidgetsDisplayOverride,
  patchWidgetsForDisplay,
  resetWidgetsForDisplay,
  resolveWidgetsForDisplay,
  resolveWeatherGeoAdjusted,
  WIDGET_LABELS,
  TABOCALYPSE_SETTINGS_LOCAL_KEYS,
  resolveUserBackgroundImage,
  resolveNotesListPanelVisible,
  stableUserBackgroundIdFromDataUrl,
  isHudAutoRepositionEnabled,
} = await import("./settings");

const { settingsBackgroundGradientCss } = await import("./background-gradient-css");

describe("isHudAutoRepositionEnabled", () => {
  it("is priority 1: off disables auto-reposition regardless of other flags", () => {
    const base = defaultSettings();
    expect(
      isHudAutoRepositionEnabled({
        ...base,
        hudLayoutAutoReposition: false,
        hudLayoutLocked: false,
        hudLayoutAdaptiveWhileLocked: true,
      }),
    ).toBe(false);
  });

  it("allows auto-reposition when enabled and unlocked", () => {
    const base = defaultSettings();
    expect(
      isHudAutoRepositionEnabled({
        ...base,
        hudLayoutAutoReposition: true,
        hudLayoutLocked: false,
        hudLayoutAdaptiveWhileLocked: false,
      }),
    ).toBe(true);
  });

  it("allows auto-reposition when locked and adaptive while locked is on", () => {
    const base = defaultSettings();
    expect(
      isHudAutoRepositionEnabled({
        ...base,
        hudLayoutAutoReposition: true,
        hudLayoutLocked: true,
        hudLayoutAdaptiveWhileLocked: true,
      }),
    ).toBe(true);
  });

  it("blocks auto-reposition when locked without adaptive", () => {
    const base = defaultSettings();
    expect(
      isHudAutoRepositionEnabled({
        ...base,
        hudLayoutAutoReposition: true,
        hudLayoutLocked: true,
        hudLayoutAdaptiveWhileLocked: false,
      }),
    ).toBe(false);
  });
});

describe("WIDGET_LABELS", () => {
  it("defines a non-empty user-facing label for every widget key", () => {
    for (const key of Object.keys(DEFAULT_WIDGETS) as (keyof typeof DEFAULT_WIDGETS)[]) {
      expect(WIDGET_LABELS[key]?.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("mergeWidgets", () => {
  it("merges known keys and ignores removed or unknown widget keys", () => {
    const m = mergeWidgets({
      clock: false,
      humorBanner: true,
      productivityGag: true,
    });
    expect(m.clock).toBe(false);
    expect(m.humorBanner).toBe(true);
    expect(Object.keys(m).sort()).toEqual(Object.keys(DEFAULT_WIDGETS).sort());
  });
});

describe("per-display widget toggles", () => {
  const displayA = "0,0,1920,1080";
  const displayB = "1920,0,2560,1440";
  const base = { ...DEFAULT_WIDGETS, weather: true, clock: true, crypto: false };

  it("resolveWidgetsForDisplay falls back to synced base when no override", () => {
    expect(resolveWidgetsForDisplay(base, {}, displayA).weather).toBe(true);
    expect(resolveWidgetsForDisplay(base, undefined, displayA).clock).toBe(true);
  });

  it("resolveWidgetsForDisplay merges partial per-monitor overrides", () => {
    const byDisplay = {
      [displayB]: { crypto: true, weather: false },
    };
    const resolved = resolveWidgetsForDisplay(base, byDisplay, displayB);
    expect(resolved.crypto).toBe(true);
    expect(resolved.weather).toBe(false);
    expect(resolved.clock).toBe(true);
  });

  it("patchWidgetsForDisplay layers updates without clobbering other monitors", () => {
    const patched = patchWidgetsForDisplay({ [displayA]: { todo: false } }, displayB, {
      bookmarksStrip: true,
    });
    expect(patched[displayA]?.todo).toBe(false);
    expect(patched[displayB]?.bookmarksStrip).toBe(true);
  });

  it("resetWidgetsForDisplay removes overrides for one monitor only", () => {
    const byDisplay = {
      [displayA]: { clock: false },
      [displayB]: { weather: false },
    };
    const next = resetWidgetsForDisplay(byDisplay, displayA);
    expect(next[displayA]).toBeUndefined();
    expect(next[displayB]?.weather).toBe(false);
  });

  it("coerceWidgetsByDisplay drops invalid keys and empty partials", () => {
    expect(
      coerceWidgetsByDisplay({
        [displayA]: { clock: false, evilWidget: true },
        bad: "nope",
        [displayB]: {},
      }),
    ).toEqual({ [displayA]: { clock: false } });
  });

  it("hasWidgetsDisplayOverride is false until a monitor has toggles", () => {
    expect(hasWidgetsDisplayOverride(undefined, displayA)).toBe(false);
    expect(hasWidgetsDisplayOverride({ [displayA]: {} }, displayA)).toBe(false);
    expect(hasWidgetsDisplayOverride({ [displayA]: { clock: true } }, displayA)).toBe(true);
  });
});

describe("resolveWeatherGeoAdjusted", () => {
  it("preserves an explicit stored flag", () => {
    expect(resolveWeatherGeoAdjusted({ weatherGeoAdjusted: false })).toBe(false);
    expect(resolveWeatherGeoAdjusted({ weatherGeoAdjusted: true })).toBe(true);
  });

  it("infers true from custom coordinates or auto geo for upgrades", () => {
    expect(
      resolveWeatherGeoAdjusted({
        weatherLat: 34.0522,
        weatherLon: -118.2437,
      }),
    ).toBe(true);
    expect(resolveWeatherGeoAdjusted({ weatherAutoGeo: true })).toBe(true);
  });
});

describe("coercePreset", () => {
  it("preserves known preset keys", () => {
    const d = defaultSettings();
    expect(coercePreset("focus", d.preset)).toBe("focus");
    expect(coercePreset("balanced", d.preset)).toBe("balanced");
    expect(coercePreset("chaos", d.preset)).toBe("chaos");
  });

  it("falls back when preset is unknown or malformed", () => {
    const d = defaultSettings();
    expect(coercePreset("garbage", d.preset)).toBe(d.preset);
    expect(coercePreset(42, d.preset)).toBe(d.preset);
    expect(coercePreset(null, "balanced")).toBe("balanced");
  });
});

describe("applyFocusPresetHarmony", () => {
  it("forces humor off and humor banner off", () => {
    const base = {
      ...defaultSettings(),
      preset: "focus" as const,
      humorEnabled: true,
      humorIntensity: "spicy" as const,
      widgets: { ...defaultSettings().widgets, humorBanner: true },
      widgetsByDisplay: { "1920x1080": { humorBanner: true } },
    };
    const next = applyFocusPresetHarmony(base);
    expect(next.humorEnabled).toBe(false);
    expect(next.humorIntensity).toBe("off");
    expect(next.widgets.humorBanner).toBe(false);
    expect(next.widgetsByDisplay["1920x1080"]?.humorBanner).toBeUndefined();
  });

  it("does not change non-focus profiles", () => {
    const base = defaultSettings();
    expect(applyFocusPresetHarmony(base)).toBe(base);
  });
});

describe("applyChaosPresetHumorHarmony", () => {
  it("elevates mild/off to spicy while preserving unhinged", () => {
    const spicy = applyChaosPresetHumorHarmony({
      ...defaultSettings(),
      humorIntensity: "mild",
    });
    expect(spicy.humorIntensity).toBe("spicy");
    expect(spicy.humorEnabled).toBe(true);

    const unhinged = applyChaosPresetHumorHarmony({
      ...defaultSettings(),
      humorIntensity: "unhinged",
    });
    expect(unhinged.humorIntensity).toBe("unhinged");
  });

  it("does not force humor banner back on when the user turned it off", () => {
    const s = applyChaosPresetHumorHarmony({
      ...defaultSettings(),
      preset: "chaos",
      widgets: { ...defaultSettings().widgets, humorBanner: false },
    });
    expect(s.widgets.humorBanner).toBe(false);
  });

  it("does not change balanced profiles", () => {
    const s = applyChaosPresetHumorHarmony({ ...defaultSettings(), preset: "balanced" });
    expect(s.preset).toBe("balanced");
    expect(s.humorIntensity).toBe(defaultSettings().humorIntensity);
  });
});

describe("settingsBackgroundGradientCss", () => {
  it("builds linear two-stop CSS with angle", () => {
    const s = {
      ...defaultSettings(),
      backgroundGradientShape: "linear" as const,
      backgroundGradientAngleDeg: 90,
      backgroundSolid: "#000000",
      backgroundGradientEnd: "#ffffff",
    };
    expect(settingsBackgroundGradientCss(s)).toBe(
      "linear-gradient(90deg, #000000 0%, #ffffff 100%)",
    );
  });

  it("builds radial CSS at configured center", () => {
    const s = {
      ...defaultSettings(),
      backgroundGradientShape: "radial" as const,
      backgroundGradientCenterXPct: 25,
      backgroundGradientCenterYPct: 75,
      backgroundSolid: "#111111",
      backgroundGradientEnd: "#222222",
    };
    expect(settingsBackgroundGradientCss(s)).toBe(
      "radial-gradient(circle at 25% 75%, #111111, #222222)",
    );
  });
});

describe("defaultSettings", () => {
  it("returns version 1 and sane defaults", () => {
    const s = defaultSettings();
    expect(s.version).toBe(1);
    expect(s.preset).toBe("chaos");
    expect(s.themeMode).toBe("dark");
    expect(s.themePalette).toBe("glitch");
    expect(s.themeAccentsMatchWallpaper).toBe(true);
    expect(s.widgets.search).toBe(true);
    expect(s.widgets.clock).toBe(true);
    expect(s.widgets.notes).toBe(true);
    expect(s.widgets.todo).toBe(true);
    expect(s.widgets.weather).toBe(true);
    expect(s.widgets.crypto).toBe(true);
    expect(s.widgets.humorBanner).toBe(true);
    expect(s.widgets.topSites).toBe(false);
    expect(s.widgets.bookmarksStrip).toBe(false);
    expect(s.widgets.tabGuilt).toBe(false);
    expect(s.importedPacks).toEqual([]);
    expect(s.importedPlugins).toEqual([]);
    expect(s.openaiBaseUrl).toBe("https://api.openai.com/v1");
    expect(s.clockHourFormat).toBe("24h");
    expect(s.weatherTemperatureUnitAuto).toBe(true);
    expect(s.weatherGeoAdjusted).toBe(false);
    expect(s.clockHourFormatAuto).toBe(false);
    expect(s.cryptoChartDays).toBe(1);
    expect(s.cryptoWatchlist).toEqual([
      {
        coinId: "bitcoin",
        symbol: "BTC",
        iconUrl: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
      },
      {
        coinId: "ethereum",
        symbol: "ETH",
        iconUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
      },
    ]);
    expect(s.userBackgroundImages).toEqual([]);
    expect(s.backgroundRotateMinutesBing).toBeGreaterThanOrEqual(1);
    expect(s.backgroundRotate).toBe(true);
    expect(s.backgroundKind).toBe("bing");
    expect(s.hudLayoutAutoReposition).toBe(true);
    expect(s.hudLayoutAdaptiveWhileLocked).toBe(true);
    expect(s.humorIntensity).toBe("spicy");
    expect(s.humorBuiltinVoice).toBe("gen_z");
    expect(s.humorIncludeUnsuckClassics).toBe(true);
    expect(s.notes).toEqual([]);
    expect(s.notePanels).toEqual([]);
    expect(s.notePanelsEpoch).toBe(0);
    expect(s.hasSeenSettingsIntro).toBe(false);
    expect(s.searchFocusOnNewTab).toBe(false);
    expect(s.searchEngine).toBe("ddg");
    expect(s.bookmarksStripHidden).toEqual([]);
    expect(s.bookmarksStripOrder).toEqual([]);
  });
});

describe("resolveNotesListPanelVisible", () => {
  it("always shows the list when no stickies are on the canvas", () => {
    expect(resolveNotesListPanelVisible([], true)).toBe(true);
    expect(resolveNotesListPanelVisible([], false)).toBe(true);
  });

  it("follows notesListPanelVisible when stickies are on the canvas", () => {
    const panels = [{ noteId: "n1", position: { xPx: 0, yPx: 0, widthPx: 260, heightPx: 220 } }];
    expect(resolveNotesListPanelVisible(panels, true)).toBe(true);
    expect(resolveNotesListPanelVisible(panels, false)).toBe(false);
  });
});

describe("resolveUserBackgroundImage", () => {
  const images = [
    { id: "a", dataUrl: "data:image/png;base64,QQ==", positionXPct: 50, positionYPct: 50 },
    { id: "b", dataUrl: "data:image/png;base64,Qg==", positionXPct: 50, positionYPct: 50 },
  ];

  it("returns the active row when rotation is off", () => {
    expect(resolveUserBackgroundImage(images, "b", false, 60_000)?.id).toBe("b");
  });

  it("falls back to the first row when active id is unknown", () => {
    expect(resolveUserBackgroundImage(images, "missing", false, 60_000)?.id).toBe("a");
  });

  it("rotates by time slot when rotation is on", () => {
    const step = 60_000;
    expect(resolveUserBackgroundImage(images, null, true, step, 0)?.id).toBe("a");
    expect(resolveUserBackgroundImage(images, null, true, step, step)?.id).toBe("b");
    expect(resolveUserBackgroundImage(images, null, true, step, step * 2)?.id).toBe("a");
  });
});

describe("stableUserBackgroundIdFromDataUrl", () => {
  it("is stable for the same inputs", () => {
    const u = "data:image/png;base64,TEST";
    expect(stableUserBackgroundIdFromDataUrl(u, 0)).toBe(stableUserBackgroundIdFromDataUrl(u, 0));
    expect(stableUserBackgroundIdFromDataUrl(u, 0)).not.toBe(
      stableUserBackgroundIdFromDataUrl(u, 1),
    );
  });
});

describe("applyPreset", () => {
  it("disables humor widgets for focus", () => {
    const s = defaultSettings();
    const next = applyPreset("focus", s);
    expect(next.preset).toBe("focus");
    expect(next.humorEnabled).toBe(false);
    expect(next.widgets.humorBanner).toBe(false);
    expect(next.widgets.search).toBe(true);
  });

  it("chaos preset enables spicy intensity and humor banner", () => {
    const base = defaultSettings();
    const s = applyPreset("chaos", base);
    expect(s.preset).toBe("chaos");
    expect(s.humorIntensity).toBe("spicy");
    expect(s.widgets.humorBanner).toBe(true);
  });

  it("balanced preset enables mild humor", () => {
    const base = defaultSettings();
    const s = applyPreset("balanced", base);
    expect(s.preset).toBe("balanced");
    expect(s.humorIntensity).toBe("mild");
  });

  it("focus preset disables humor", () => {
    const base = defaultSettings();
    const s = applyPreset("focus", base);
    expect(s.preset).toBe("focus");
    expect(s.humorEnabled).toBe(false);
  });
});

describe("loadSettings", () => {
  beforeEach(() => {
    syncGet.mockReset();
    localGet.mockReset();
    syncGet.mockResolvedValue({});
    localGet.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("migrates legacy humorGenZMode from sync to humorBuiltinVoice gen_z", async () => {
    syncGet.mockResolvedValue({ [SYNC_KEY]: { humorGenZMode: true } });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.humorBuiltinVoice).toBe("gen_z");
  });

  it("prefers humorBuiltinVoice over legacy humorGenZMode when both exist", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: { humorGenZMode: true, humorBuiltinVoice: "unsuck_classics" },
    });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.humorBuiltinVoice).toBe("unsuck_classics");
  });

  it("defaults humorIncludeUnsuckClassics off when sync exists but omits the flag (upgrade)", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: {
        version: 1,
        preset: "chaos",
        humorEnabled: true,
        humorIntensity: "spicy",
        humorBuiltinVoice: "gen_z",
        humorBuiltinPackIds: [],
        spicyContentAcknowledged: false,
        widgets: {},
        searchEngine: "ddg",
        weatherLat: 0,
        weatherLon: 0,
        weatherTemperatureUnit: "celsius",
        clockHourFormat: "24h",
        weatherAutoGeo: false,
        bingWallpaperCountryAuto: true,
        bingWallpaperCountry: "us",
        backgroundKind: "gradient",
        backgroundSolid: "#0f0f12",
        backgroundGradientMid: "#1a1a1f",
        backgroundGradientEnd: "#2a2a33",
        backgroundGradientShape: "linear",
        backgroundGradientAngleDeg: 145,
        backgroundGradientCenterXPct: 50,
        backgroundGradientCenterYPct: 50,
        debugPluginSource: false,
      },
    });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.humorIncludeUnsuckClassics).toBe(false);
    expect(s.weatherTemperatureUnitAuto).toBe(false);
    expect(s.clockHourFormatAuto).toBe(false);
  });

  it("defaults missing preset to chaos and aligns mild leftovers with Chaos humor", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: { humorIntensity: "mild", humorEnabled: true },
    });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.preset).toBe("chaos");
    expect(s.humorIntensity).toBe("spicy");
    expect(s.humorEnabled).toBe(true);
    expect(s.widgets.humorBanner).toBe(true);
  });

  it("coerces invalid preset tokens to chaos and harmonizes joke intensity", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: { preset: "garbage-token", humorIntensity: "mild", humorEnabled: true },
    });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.preset).toBe("chaos");
    expect(s.humorIntensity).toBe("spicy");
    expect(s.widgets.humorBanner).toBe(true);
  });

  it("keeps humor banner off on chaos preset when stored that way", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: {
        preset: "chaos",
        humorEnabled: true,
        humorIntensity: "spicy",
        widgets: { humorBanner: false },
      },
    });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.preset).toBe("chaos");
    expect(s.widgets.humorBanner).toBe(false);
  });

  it("keeps unhinged when preset is chaos", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: { preset: "chaos", humorIntensity: "unhinged", humorEnabled: true },
    });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.preset).toBe("chaos");
    expect(s.humorIntensity).toBe("unhinged");
  });

  it("merges empty storage into defaults", async () => {
    const s = await loadSettings();
    expect(s).toEqual(defaultSettings());
    expect(syncGet).toHaveBeenCalledWith([SYNC_KEY, NOTES_SYNC_KEY]);
    expect(localGet).toHaveBeenCalledWith([...TABOCALYPSE_SETTINGS_LOCAL_KEYS]);
  });

  it("defaults backgroundRotate when local slice has non-boolean garbage", async () => {
    localGet.mockResolvedValue({
      [LOCAL_KEY]: {
        version: 1,
        userBackgroundDataUrl: null,
        userBackgroundDataUrls: [],
        backgroundRotate: "junk" as unknown as boolean,
        openaiApiKey: "",
        openaiBaseUrl: "https://api.openai.com/v1",
        myLines: [],
        importedPacks: [],
        importedPlugins: [],
        notesText: "",
        todos: [],
      },
    });
    const s = await loadSettings();
    expect(s.backgroundRotate).toBe(true);
  });

  it("loads from local only when storage.sync is unavailable", async () => {
    mockBrowser.storage.sync = null;
    try {
      const s = await loadSettings();
      expect(s).toEqual(defaultSettings());
      expect(syncGet).not.toHaveBeenCalled();
      expect(localGet).toHaveBeenCalledWith([...TABOCALYPSE_SETTINGS_LOCAL_KEYS]);
    } finally {
      mockBrowser.storage.sync = { get: syncGet, set: syncSet };
    }
  });

  it("merges partial sync and local slices", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: {
        version: 1,
        preset: "focus",
        humorEnabled: false,
        humorIntensity: "off",
        humorBuiltinPackIds: ["a"],
        spicyContentAcknowledged: true,
        widgets: { humorBanner: false },
        searchEngine: "google",
        weatherLat: 1,
        weatherLon: 2,
        weatherAutoGeo: true,
        bingWallpaperCountryAuto: false,
        bingWallpaperCountry: "de",
        backgroundKind: "solid",
        backgroundSolid: "#fff",
        debugPluginSource: true,
        themeMode: "light",
        themePalette: "ocean",
      },
    });
    localGet.mockResolvedValue({
      [LOCAL_KEY]: {
        version: 1,
        userBackgroundDataUrl: null,
        userBackgroundDataUrls: [],
        backgroundRotate: false,
        openaiApiKey: "sk",
        openaiBaseUrl: "https://example.com/v1",
        myLines: ["line"],
        importedPacks: [],
        importedPlugins: [],
        notesText: "n",
        todos: [{ id: "1", text: "t", done: false }],
      },
    });
    const s = await loadSettings();
    expect(s.preset).toBe("focus");
    expect(s.searchEngine).toBe("google");
    expect(s.openaiBaseUrl).toBe("https://example.com/v1");
    expect(s.myLines).toEqual(["line"]);
    expect(s.notesText).toBe("");
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0]?.text).toBe("n");
    expect(s.notePanels).toEqual([]);
    expect(s.todos).toEqual([{ id: "1", text: "t", done: false }]);
    expect(s.widgets.humorBanner).toBe(false);
    expect(s.widgets.search).toBe(true);
    expect(s.themeMode).toBe("light");
    expect(s.themePalette).toBe("ocean");
    expect(s.hasSeenSettingsIntro).toBe(true);
  });

  it("reconciles stale humor flags when preset is focus", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: {
        version: 1,
        preset: "focus",
        humorEnabled: true,
        humorIntensity: "spicy",
        humorBuiltinPackIds: [],
        spicyContentAcknowledged: false,
        widgets: { humorBanner: true },
        searchEngine: "google",
        weatherLat: 0,
        weatherLon: 0,
        weatherAutoGeo: false,
        bingWallpaperCountryAuto: true,
        bingWallpaperCountry: "us",
        backgroundKind: "solid",
        backgroundSolid: "#000",
        debugPluginSource: false,
        themeMode: "dark",
        themePalette: "glitch",
      },
    });
    localGet.mockResolvedValue({
      [LOCAL_KEY]: {
        version: 1,
        userBackgroundDataUrl: null,
        userBackgroundDataUrls: [],
        openaiApiKey: "",
        openaiBaseUrl: "https://api.openai.com/v1",
        myLines: [],
        importedPacks: [],
        importedPlugins: [],
        notesText: "",
        todos: [],
      },
    });
    const s = await loadSettings();
    expect(s.preset).toBe("focus");
    expect(s.humorEnabled).toBe(false);
    expect(s.humorIntensity).toBe("off");
    expect(s.widgets.humorBanner).toBe(false);
  });

  it("infers weatherGeoAdjusted for upgraded profiles with custom coordinates", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: {
        version: 1,
        preset: "balanced",
        themeMode: "dark",
        themePalette: "glitch",
        humorEnabled: true,
        humorIntensity: "mild",
        humorBuiltinPackIds: [],
        spicyContentAcknowledged: false,
        widgets: {},
        searchEngine: "ddg",
        weatherLat: 34.0522,
        weatherLon: -118.2437,
        weatherTemperatureUnit: "celsius",
        clockHourFormat: "24h",
        weatherAutoGeo: false,
        bingWallpaperCountryAuto: true,
        bingWallpaperCountry: "us",
        backgroundKind: "gradient",
        backgroundSolid: "#0f0f12",
        backgroundGradientMid: "#1a1a1f",
        backgroundGradientEnd: "#2a2a33",
        backgroundGradientShape: "linear",
        backgroundGradientAngleDeg: 145,
        backgroundGradientCenterXPct: 50,
        backgroundGradientCenterYPct: 50,
        debugPluginSource: false,
      },
    });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.weatherGeoAdjusted).toBe(true);
  });

  it("honors explicit hasSeenSettingsIntro false in sync", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: {
        version: 1,
        preset: "balanced",
        themeMode: "dark",
        themePalette: "glitch",
        humorEnabled: true,
        humorIntensity: "mild",
        humorBuiltinPackIds: [],
        spicyContentAcknowledged: false,
        widgets: {},
        searchEngine: "ddg",
        weatherLat: 0,
        weatherLon: 0,
        weatherTemperatureUnit: "celsius",
        clockHourFormat: "24h",
        weatherAutoGeo: false,
        bingWallpaperCountryAuto: true,
        bingWallpaperCountry: "us",
        backgroundKind: "gradient",
        backgroundSolid: "#0f0f12",
        backgroundGradientMid: "#1a1a1f",
        backgroundGradientEnd: "#2a2a33",
        backgroundGradientShape: "linear",
        backgroundGradientAngleDeg: 145,
        backgroundGradientCenterXPct: 50,
        backgroundGradientCenterYPct: 50,
        debugPluginSource: false,
        hasSeenSettingsIntro: false,
      },
    });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.hasSeenSettingsIntro).toBe(false);
  });

  it("prefers local sync mirror over cloud sync for overlapping fields", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: {
        version: 1,
        preset: "balanced",
        themeMode: "dark",
        themePalette: "glitch",
        humorEnabled: true,
        humorIntensity: "mild",
        humorBuiltinPackIds: ["tab_shame"],
        spicyContentAcknowledged: false,
        widgets: { humorBanner: true },
        searchEngine: "ddg",
        weatherLat: 0,
        weatherLon: 0,
        weatherAutoGeo: false,
        bingWallpaperCountryAuto: true,
        bingWallpaperCountry: "us",
        backgroundKind: "gradient",
        backgroundSolid: "#0f0f12",
        debugPluginSource: false,
      },
    });
    localGet.mockResolvedValue({
      [LOCAL_KEY]: {
        version: 1,
        userBackgroundDataUrl: null,
        userBackgroundDataUrls: [],
        backgroundRotate: false,
        openaiApiKey: "",
        openaiBaseUrl: "https://api.openai.com/v1",
        myLines: [],
        importedPacks: [],
        importedPlugins: [],
        notesText: "",
        todos: [],
      },
      [TABOCALYPSE_SETTINGS_LOCAL_KEYS[1]]: {
        version: 1,
        preset: "balanced",
        themeMode: "dark",
        themePalette: "ocean",
        humorEnabled: true,
        humorIntensity: "mild",
        humorBuiltinPackIds: ["tab_shame"],
        spicyContentAcknowledged: false,
        widgets: { humorBanner: true },
        searchEngine: "ddg",
        weatherLat: 0,
        weatherLon: 0,
        weatherAutoGeo: false,
        bingWallpaperCountryAuto: true,
        bingWallpaperCountry: "us",
        backgroundKind: "gradient",
        backgroundSolid: "#0f0f12",
        debugPluginSource: false,
      },
    });
    const s = await loadSettings();
    expect(s.themePalette).toBe("ocean");
  });

  it("migrates legacy userBackgroundDataUrls into structured images", async () => {
    syncGet.mockResolvedValue({});
    localGet.mockResolvedValue({
      [LOCAL_KEY]: {
        version: 1,
        userBackgroundDataUrl: null,
        userBackgroundDataUrls: ["data:image/png;base64,QQ==", "data:image/png;base64,Qg=="],
        backgroundRotate: false,
        openaiApiKey: "",
        openaiBaseUrl: "https://api.openai.com/v1",
        myLines: [],
        importedPacks: [],
        importedPlugins: [],
        notesText: "",
        todos: [],
      },
    });
    const s = await loadSettings();
    expect(s.userBackgroundImages).toHaveLength(2);
    expect(s.userBackgroundImages[0]!.dataUrl).toBe("data:image/png;base64,QQ==");
    expect(s.userBackgroundImages[0]!.id).toBeTruthy();
  });
  it("loads notes from storage.sync tabocalypseNotes", async () => {
    const note = {
      id: "n1",
      name: "A",
      tags: [],
      text: "hello",
      locked: false,
      createdAt: 100,
      updatedAt: 200,
    };
    syncGet.mockResolvedValue({
      [NOTES_SYNC_KEY]: {
        version: 1,
        notes: [note],
        notePanels: [{ noteId: "n1", position: { xPct: 70, yPct: 2 } }],
        notePanelsEpoch: 3,
      },
    });
    const s = await loadSettings();
    expect(s.notes).toEqual([note]);
    expect(s.notePanels).toEqual([
      { noteId: "n1", position: { xPx: 840, yPx: 16, widthPx: 260, heightPx: 220 } },
    ]);
    expect(s.notePanelsEpoch).toBe(3);
  });

  it("defaults experimental features off when sync omits them", async () => {
    syncGet.mockResolvedValue({ [SYNC_KEY]: { version: 1, preset: "balanced" } });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.experimentalFeatures).toEqual(DEFAULT_EXPERIMENTAL_FEATURES);
  });

  it("coerces stored experimental feature toggles on load", async () => {
    syncGet.mockResolvedValue({
      [SYNC_KEY]: {
        version: 1,
        experimentalFeatures: { weatherHudGamification: true, unknownFlag: true },
      },
    });
    localGet.mockResolvedValue({});
    const s = await loadSettings();
    expect(s.experimentalFeatures.weatherHudGamification).toBe(true);
    expect(Object.keys(s.experimentalFeatures).sort()).toEqual(
      Object.keys(DEFAULT_EXPERIMENTAL_FEATURES).sort(),
    );
  });

  it("merges newer note from sync over older mirror by updatedAt", async () => {
    const older = {
      id: "n1",
      name: "A",
      tags: [],
      text: "old",
      locked: false,
      createdAt: 1,
      updatedAt: 10,
    };
    const newer = { ...older, text: "new", updatedAt: 50 };
    syncGet.mockResolvedValue({
      [NOTES_SYNC_KEY]: { version: 1, notes: [newer], notePanels: [], notePanelsEpoch: 0 },
    });
    localGet.mockResolvedValue({
      [TABOCALYPSE_SETTINGS_LOCAL_KEYS[2]]: {
        version: 1,
        notes: [older],
        notePanels: [],
        notePanelsEpoch: 0,
      },
    });
    const s = await loadSettings();
    expect(s.notes[0]?.text).toBe("new");
  });
});

describe("saveSettings", () => {
  beforeEach(() => {
    syncSet.mockReset();
    localSet.mockReset();
    syncSet.mockResolvedValue(undefined);
    localSet.mockResolvedValue(undefined);
  });

  it("writes sync and local payloads with expected keys", async () => {
    const s = defaultSettings();
    s.preset = "chaos";
    s.openaiApiKey = "secret";
    s.importedPacks = [
      {
        id: "p1",
        name: "P",
        version: "1",
        enabled: true,
        messages: ["hi"],
        importedAt: 42,
      },
    ];
    await saveSettings(s);
    expect(syncSet).toHaveBeenCalledTimes(1);
    expect(localSet).toHaveBeenCalledTimes(1);
    const syncArg = syncSet.mock.calls[0]![0] as Record<string, unknown>;
    const localArg = localSet.mock.calls[0]![0] as Record<string, unknown>;
    expect(syncArg[SYNC_KEY]).toMatchObject({
      version: 1,
      preset: "chaos",
      themeMode: "dark",
      themePalette: "glitch",
    });
    expect(syncArg[NOTES_SYNC_KEY]).toMatchObject({
      version: 1,
      notes: s.notes,
      notePanels: s.notePanels,
      notePanelsEpoch: s.notePanelsEpoch,
    });
    expect(localArg[LOCAL_KEY]).toMatchObject({
      version: 1,
      openaiApiKey: "secret",
      importedPacks: s.importedPacks,
    });
    expect(localArg[LOCAL_KEY]).not.toHaveProperty("preset");
    expect(localArg[LOCAL_KEY]).not.toHaveProperty("notes");
    expect(localArg[TABOCALYPSE_SETTINGS_LOCAL_KEYS[1]]).toEqual(syncArg[SYNC_KEY]);
    expect(localArg[TABOCALYPSE_SETTINGS_LOCAL_KEYS[2]]).toEqual(syncArg[NOTES_SYNC_KEY]);
  });

  it("writes local only when storage.sync is unavailable", async () => {
    mockBrowser.storage.sync = null;
    try {
      const s = defaultSettings();
      await saveSettings(s);
      expect(syncSet).not.toHaveBeenCalled();
      expect(localSet).toHaveBeenCalledTimes(1);
    } finally {
      mockBrowser.storage.sync = { get: syncGet, set: syncSet };
    }
  });

  it("replaces sync quota errors with a user-friendly message", async () => {
    syncSet.mockRejectedValueOnce(
      new Error("This request exceeds the MAX_WRITE_OPERATIONS_PER_MINUTE quota."),
    );
    const s = defaultSettings();
    await expect(saveSettings(s)).rejects.toThrow(/saved locally/);
    expect(localSet).toHaveBeenCalledTimes(1);
  });

  it("re-throws non-quota sync errors unchanged", async () => {
    syncSet.mockRejectedValueOnce(new Error("network down"));
    const s = defaultSettings();
    await expect(saveSettings(s)).rejects.toThrow("network down");
  });
});
