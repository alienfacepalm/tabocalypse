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

const { loadSettings, saveSettings, defaultSettings, applyPreset, DEFAULT_WIDGETS, WIDGET_LABELS } =
  await import("./settings");

describe("WIDGET_LABELS", () => {
  it("defines a non-empty user-facing label for every widget key", () => {
    for (const key of Object.keys(DEFAULT_WIDGETS) as (keyof typeof DEFAULT_WIDGETS)[]) {
      expect(WIDGET_LABELS[key]?.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("defaultSettings", () => {
  it("returns version 1 and sane defaults", () => {
    const s = defaultSettings();
    expect(s.version).toBe(1);
    expect(s.preset).toBe("balanced");
    expect(s.widgets.search).toBe(true);
    expect(s.importedPacks).toEqual([]);
    expect(s.importedPlugins).toEqual([]);
    expect(s.openaiBaseUrl).toBe("https://api.openai.com/v1");
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

  it("chaos preset enables spicy intensity and productivity gag", () => {
    const s = applyPreset("chaos", defaultSettings());
    expect(s.preset).toBe("chaos");
    expect(s.humorIntensity).toBe("spicy");
    expect(s.widgets.productivityGag).toBe(true);
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

  it("merges empty storage into defaults", async () => {
    const s = await loadSettings();
    expect(s).toEqual(defaultSettings());
    expect(syncGet).toHaveBeenCalledWith(SYNC_KEY);
    expect(localGet).toHaveBeenCalledWith(LOCAL_KEY);
  });

  it("loads from local only when storage.sync is unavailable", async () => {
    mockBrowser.storage.sync = null;
    try {
      const s = await loadSettings();
      expect(s).toEqual(defaultSettings());
      expect(syncGet).not.toHaveBeenCalled();
      expect(localGet).toHaveBeenCalledWith(LOCAL_KEY);
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
    expect(s.notesText).toBe("n");
    expect(s.todos).toEqual([{ id: "1", text: "t", done: false }]);
    expect(s.widgets.humorBanner).toBe(false);
    expect(s.widgets.search).toBe(true);
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
    });
    expect(localArg[LOCAL_KEY]).toMatchObject({
      version: 1,
      openaiApiKey: "secret",
      importedPacks: s.importedPacks,
    });
    expect(localArg[LOCAL_KEY]).not.toHaveProperty("preset");
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
});
