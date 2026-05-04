import type { ImportedPlugin } from "@tabocalypse/plugin-sdk";
import browser from "webextension-polyfill";

export type { ImportedPlugin, PluginWidget } from "@tabocalypse/plugin-sdk";

export type HumorIntensity = "off" | "mild" | "spicy" | "unhinged";

export type WidgetKey =
  | "search"
  | "clock"
  | "notes"
  | "todo"
  | "weather"
  | "topSites"
  | "bookmarksStrip"
  | "tabGuilt"
  | "humorBanner"
  | "productivityGag";

export interface ImportedUserPack {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  messages: string[];
  importedAt: number;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Settings {
  version: 1;
  preset: "focus" | "balanced" | "chaos";
  humorEnabled: boolean;
  humorIntensity: HumorIntensity;
  humorBuiltinPackIds: string[];
  spicyContentAcknowledged: boolean;
  widgets: Record<WidgetKey, boolean>;
  searchEngine: "ddg" | "google" | "bing";
  weatherLat: number;
  weatherLon: number;
  weatherAutoGeo: boolean;
  useOpenWeather: boolean;
  backgroundKind: "solid" | "gradient" | "image";
  backgroundSolid: string;
  userBackgroundDataUrl: string | null;
  openWeatherApiKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  myLines: string[];
  importedPacks: ImportedUserPack[];
  importedPlugins: ImportedPlugin[];
  debugPluginSource: boolean;
  notesText: string;
  todos: TodoItem[];
}

const SYNC_KEY = "tabocalypseSync";
const LOCAL_KEY = "tabocalypseLocal";

export interface SyncSlice {
  version: 1;
  preset: Settings["preset"];
  humorEnabled: boolean;
  humorIntensity: HumorIntensity;
  humorBuiltinPackIds: string[];
  spicyContentAcknowledged: boolean;
  widgets: Record<WidgetKey, boolean>;
  searchEngine: Settings["searchEngine"];
  weatherLat: number;
  weatherLon: number;
  weatherAutoGeo: boolean;
  useOpenWeather: boolean;
  backgroundKind: Settings["backgroundKind"];
  backgroundSolid: string;
  debugPluginSource: boolean;
}

export interface LocalSlice {
  version: 1;
  userBackgroundDataUrl: string | null;
  openWeatherApiKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  myLines: string[];
  importedPacks: ImportedUserPack[];
  importedPlugins: ImportedPlugin[];
  notesText: string;
  todos: TodoItem[];
}

export const DEFAULT_WIDGETS: Record<WidgetKey, boolean> = {
  search: true,
  clock: true,
  notes: false,
  todo: false,
  weather: false,
  topSites: false,
  bookmarksStrip: false,
  tabGuilt: false,
  humorBanner: true,
  productivityGag: false,
};

export function defaultSettings(): Settings {
  return {
    version: 1,
    preset: "balanced",
    humorEnabled: true,
    humorIntensity: "mild",
    humorBuiltinPackIds: ["tab_shame", "error_messages", "dev_snark"],
    spicyContentAcknowledged: false,
    widgets: { ...DEFAULT_WIDGETS },
    searchEngine: "ddg",
    weatherLat: 40.7128,
    weatherLon: -74.006,
    weatherAutoGeo: false,
    useOpenWeather: false,
    backgroundKind: "gradient",
    backgroundSolid: "#0f0f12",
    userBackgroundDataUrl: null,
    openWeatherApiKey: "",
    openaiApiKey: "",
    openaiBaseUrl: "https://api.openai.com/v1",
    myLines: [],
    importedPacks: [],
    importedPlugins: [],
    debugPluginSource: false,
    notesText: "",
    todos: [],
  };
}

function toSync(s: Settings): SyncSlice {
  return {
    version: 1,
    preset: s.preset,
    humorEnabled: s.humorEnabled,
    humorIntensity: s.humorIntensity,
    humorBuiltinPackIds: s.humorBuiltinPackIds,
    spicyContentAcknowledged: s.spicyContentAcknowledged,
    widgets: s.widgets,
    searchEngine: s.searchEngine,
    weatherLat: s.weatherLat,
    weatherLon: s.weatherLon,
    weatherAutoGeo: s.weatherAutoGeo,
    useOpenWeather: s.useOpenWeather,
    backgroundKind: s.backgroundKind,
    backgroundSolid: s.backgroundSolid,
    debugPluginSource: s.debugPluginSource,
  };
}

function toLocal(s: Settings): LocalSlice {
  return {
    version: 1,
    userBackgroundDataUrl: s.userBackgroundDataUrl,
    openWeatherApiKey: s.openWeatherApiKey,
    openaiApiKey: s.openaiApiKey,
    openaiBaseUrl: s.openaiBaseUrl,
    myLines: s.myLines,
    importedPacks: s.importedPacks,
    importedPlugins: s.importedPlugins,
    notesText: s.notesText,
    todos: s.todos,
  };
}

function mergeSettings(
  sync: Partial<SyncSlice> | undefined,
  local: Partial<LocalSlice> | undefined,
): Settings {
  const d = defaultSettings();
  return {
    version: 1,
    preset: sync?.preset ?? d.preset,
    humorEnabled: sync?.humorEnabled ?? d.humorEnabled,
    humorIntensity: sync?.humorIntensity ?? d.humorIntensity,
    humorBuiltinPackIds: sync?.humorBuiltinPackIds ?? d.humorBuiltinPackIds,
    spicyContentAcknowledged: sync?.spicyContentAcknowledged ?? d.spicyContentAcknowledged,
    widgets: { ...d.widgets, ...(sync?.widgets ?? {}) },
    searchEngine: sync?.searchEngine ?? d.searchEngine,
    weatherLat: sync?.weatherLat ?? d.weatherLat,
    weatherLon: sync?.weatherLon ?? d.weatherLon,
    weatherAutoGeo: sync?.weatherAutoGeo ?? d.weatherAutoGeo,
    useOpenWeather: sync?.useOpenWeather ?? d.useOpenWeather,
    backgroundKind: sync?.backgroundKind ?? d.backgroundKind,
    backgroundSolid: sync?.backgroundSolid ?? d.backgroundSolid,
    debugPluginSource: sync?.debugPluginSource ?? d.debugPluginSource,
    userBackgroundDataUrl: local?.userBackgroundDataUrl ?? d.userBackgroundDataUrl,
    openWeatherApiKey: local?.openWeatherApiKey ?? d.openWeatherApiKey,
    openaiApiKey: local?.openaiApiKey ?? d.openaiApiKey,
    openaiBaseUrl: local?.openaiBaseUrl ?? d.openaiBaseUrl,
    myLines: local?.myLines ?? d.myLines,
    importedPacks: local?.importedPacks ?? d.importedPacks,
    importedPlugins: local?.importedPlugins ?? d.importedPlugins,
    notesText: local?.notesText ?? d.notesText,
    todos: local?.todos ?? d.todos,
  };
}

export async function loadSettings(): Promise<Settings> {
  const [syncRaw, localRaw] = await Promise.all([
    browser.storage.sync.get(SYNC_KEY),
    browser.storage.local.get(LOCAL_KEY),
  ]);
  const sync = syncRaw[SYNC_KEY] as SyncSlice | undefined;
  const local = localRaw[LOCAL_KEY] as LocalSlice | undefined;
  return mergeSettings(sync, local);
}

export async function saveSettings(s: Settings): Promise<void> {
  await Promise.all([
    browser.storage.sync.set({ [SYNC_KEY]: toSync(s) }),
    browser.storage.local.set({ [LOCAL_KEY]: toLocal(s) }),
  ]);
}

export function applyPreset(preset: Settings["preset"], s: Settings): Settings {
  const next = { ...s, preset };
  if (preset === "focus") {
    next.humorEnabled = false;
    next.humorIntensity = "off";
    next.widgets = {
      ...s.widgets,
      humorBanner: false,
      productivityGag: false,
      search: true,
      clock: true,
    };
  } else if (preset === "balanced") {
    next.humorEnabled = true;
    next.humorIntensity = "mild";
    next.widgets = { ...defaultSettings().widgets, ...s.widgets, humorBanner: true };
  } else {
    next.humorEnabled = true;
    next.humorIntensity = "spicy";
    next.widgets = { ...s.widgets, humorBanner: true, productivityGag: true };
  }
  return next;
}
