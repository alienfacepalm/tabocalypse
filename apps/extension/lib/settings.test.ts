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
const LOCAL_KEY = "tabocalypseLocal";

const {
  loadSettings,
  saveSettings,
  defaultSettings,
  applyPreset,
  DEFAULT_WIDGETS,
  mergeWidgets,
  WIDGET_LABELS,
  TABOCALYPSE_SETTINGS_LOCAL_KEYS,
  resolveUserBackgroundImage,
  stableUserBackgroundIdFromDataUrl,
} = await import("./settings");

const { settingsBackgroundGradientCss } = await import("./background-gradient-css");

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
    expect(s.preset).toBe("balanced");
    expect(s.themeMode).toBe("dark");
    expect(s.themePalette).toBe("glitch");
    expect(s.widgets.search).toBe(true);
    expect(s.widgets.clock).toBe(true);
    expect(s.widgets.notes).toBe(true);
    expect(s.widgets.todo).toBe(true);
    expect(s.widgets.weather).toBe(true);
    expect(s.widgets.humorBanner).toBe(true);
    expect(s.widgets.topSites).toBe(false);
    expect(s.widgets.bookmarksStrip).toBe(false);
    expect(s.widgets.tabGuilt).toBe(false);
    expect(s.importedPacks).toEqual([]);
    expect(s.importedPlugins).toEqual([]);
    expect(s.openaiBaseUrl).toBe("https://api.openai.com/v1");
    expect(s.clockHourFormat).toBe("24h");
    expect(s.userBackgroundImages).toEqual([]);
    expect(s.backgroundRotateMinutesBing).toBeGreaterThanOrEqual(1);
    expect(s.humorBuiltinVoice).toBe("default");
    expect(s.notes).toEqual([]);
    expect(s.notePanels).toEqual([]);
    expect(s.hasSeenSettingsIntro).toBe(false);
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
    const s = applyPreset("chaos", defaultSettings());
    expect(s.preset).toBe("chaos");
    expect(s.humorIntensity).toBe("spicy");
    expect(s.widgets.humorBanner).toBe(true);
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

  it("merges empty storage into defaults", async () => {
    const s = await loadSettings();
    expect(s).toEqual(defaultSettings());
    expect(syncGet).toHaveBeenCalledWith(SYNC_KEY);
    expect(localGet).toHaveBeenCalledWith([...TABOCALYPSE_SETTINGS_LOCAL_KEYS]);
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
        useOpenWeather: true,
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
        openWeatherApiKey: "k",
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
        useOpenWeather: false,
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
        useOpenWeather: false,
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
        openWeatherApiKey: "",
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
        useOpenWeather: false,
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
        openWeatherApiKey: "",
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
    expect(localArg[LOCAL_KEY]).toMatchObject({
      version: 1,
      openaiApiKey: "secret",
      importedPacks: s.importedPacks,
    });
    expect(localArg[LOCAL_KEY]).not.toHaveProperty("preset");
    expect(localArg[TABOCALYPSE_SETTINGS_LOCAL_KEYS[1]]).toEqual(syncArg[SYNC_KEY]);
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
