import browser from "webextension-polyfill";
import {
  Bookmark,
  Braces,
  CalendarClock,
  CheckCircle2,
  CircleX,
  Download,
  ExternalLink,
  Flame,
  FolderUp,
  Heart,
  ImagePlus,
  Images,
  LayoutGrid,
  Layers,
  Lightbulb,
  MapPin,
  Moon,
  Paintbrush,
  Scale,
  Sun,
  Settings as SettingsIcon,
  Sparkles,
  Square,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { testOpenAiCompatible } from "../../lib/ai-test";
import { ClockWidget } from "../../components/clock-widget";
import { BookmarksWidget, TopSitesWidget } from "../../components/links-widget";
import { NotesWidget } from "../../components/notes-widget";
import { PluginDeck } from "../../components/plugin-views";
import { SearchWidget } from "../../components/search-widget";
import { TodoWidget } from "../../components/todo-widget";
import { WeatherWidget } from "../../components/weather-widget";
import {
  type THumorIntensity,
  type ISettings,
  type TWidgetKey,
  WIDGET_LABELS,
} from "../../lib/settings";
import {
  applyPreset,
  defaultSettings,
  isTabocalypseSettingsStorageChange,
  loadSettings,
  saveSettings,
} from "../../lib/settings";
import { BUILTIN_PACKS } from "../../lib/humor/builtin-packs";
import type { IHumorContext } from "../../lib/humor/engine";
import { pickDailyLine } from "../../lib/humor/engine";
import { validatePluginJsonText } from "@tabocalypse/plugin-sdk";
import { openExternal, SUPPORT } from "../../lib/support-links";
import {
  estimateImportedBytes,
  MAX_TOTAL_IMPORTED_BYTES,
  parsePackJsonText,
  parseTabocalypseZip,
} from "../../lib/user-packs";
import {
  compressImageFileToDataUrl,
  estimateDataUrlBytes,
} from "../../lib/compress-background-image";
import {
  fetchBingWallpaperImageUrls,
  pickDailyBingWallpaperUrl,
  pickRotatingBingWallpaperUrl,
} from "../../lib/fetch-bing-wallpaper";
import { privilegedExtensionFetchBytes } from "../../lib/privileged-extension-fetch";
import {
  applyDocumentTheme,
  coerceThemeMode,
  coerceThemePalette,
  THEME_MODE_LABELS,
  THEME_PALETTE_LABELS,
  THEME_MODES,
  THEME_PALETTES,
  themeGradientStops,
} from "../../lib/theme";

const BG_MAX = 1_500_000;
const BG_TOTAL_MAX = 6_000_000;
/** Longer side cap before encoding (decoded pixels on the canvas). */
const BG_MAX_EDGE_PX = 2560;
/** Shown in Settings — must stay in sync with BG_MAX / BG_TOTAL_MAX. */
const BG_MAX_LABEL = "1.5 MB";
const BG_TOTAL_LABEL = "6 MB";
const USER_ROTATE_MS = 15 * 60 * 1000;
const BING_ROTATE_MS = 15 * 60 * 1000;

type TSettingsUpdater = ISettings | ((current: ISettings) => ISettings);

type TBackgroundStyleExtras = {
  bingImageUrl?: string | null;
  userImageUrl?: string | null;
};

function revokeObjectUrlMaybe(url: string | null): void {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

function backgroundStyle(s: ISettings, extras?: TBackgroundStyleExtras): React.CSSProperties {
  const { mid, end } = themeGradientStops(s.themeMode);
  const grad = `linear-gradient(145deg, ${s.backgroundSolid} 0%, ${mid} 45%, ${end} 100%)`;

  if (s.backgroundKind === "bing") {
    const u = extras?.bingImageUrl;
    if (u) {
      return {
        backgroundColor: "transparent",
        backgroundImage: `url(${u})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      };
    }
    return {
      backgroundColor: "transparent",
      background: grad,
      backgroundAttachment: "fixed",
    };
  }
  if (s.backgroundKind === "solid") {
    return {
      backgroundColor: "transparent",
      background: s.backgroundSolid,
      backgroundAttachment: "fixed",
    };
  }
  if (s.backgroundKind === "image") {
    const u = extras?.userImageUrl ?? s.userBackgroundDataUrl;
    if (!u) {
      return {
        backgroundColor: "transparent",
        background: grad,
        backgroundAttachment: "fixed",
      };
    }
    return {
      backgroundColor: "transparent",
      backgroundImage: `url(${u})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
    };
  }
  return {
    backgroundColor: "transparent",
    background: grad,
    backgroundAttachment: "fixed",
  };
}

function pickRotatingUrl(urls: string[], rotate: boolean, nowMs = Date.now()): string | null {
  if (urls.length === 0) return null;
  if (!rotate) return urls[0] ?? null;
  const slot = Math.floor(nowMs / USER_ROTATE_MS);
  return urls[slot % urls.length] ?? urls[0] ?? null;
}

function applyReactStyle(target: HTMLElement, style: React.CSSProperties): void {
  const t = target.style as unknown as Record<string, string>;
  for (const k of Object.keys(style) as (keyof React.CSSProperties)[]) {
    const v = style[k];
    if (v === undefined) continue;
    if (typeof v === "number") t[String(k)] = String(v);
    else t[String(k)] = String(v);
  }
}

export default function App({ initialSettings }: { initialSettings: ISettings }) {
  const [settings, setSettings] = useState<ISettings>(initialSettings);
  const [openSettings, setOpenSettings] = useState(false);
  const [warnSpicy, setWarnSpicy] = useState(false);
  const [pendingIntensity, setPendingIntensity] = useState<THumorIntensity | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [pluginValidateLog, setPluginValidateLog] = useState<string>("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [prodScore] = useState(() => Math.floor(20 + Math.random() * 80));
  const [bingChosenUrl, setBingChosenUrl] = useState<string | null>(null);
  const [bingPaintUrl, setBingPaintUrl] = useState<string | null>(null);
  const [bingFetchErr, setBingFetchErr] = useState<string | null>(null);
  const [bingImageLoadErr, setBingImageLoadErr] = useState<string | null>(null);
  const [bingRefreshing, setBingRefreshing] = useState(false);
  const [userChosenUrl, setUserChosenUrl] = useState<string | null>(null);
  /** Mirrors `browser.permissions.contains` for optional API permissions (not widget toggles alone). */
  const [optionalApiPerms, setOptionalApiPerms] = useState({
    topSites: false,
    bookmarks: false,
    tabs: false,
  });
  const bingPaintUrlRef = useRef<string | null>(null);
  const latestSettingsRef = useRef<ISettings>(initialSettings);
  const persistChainRef = useRef<Promise<void>>(Promise.resolve());
  const myLinesSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    bingPaintUrlRef.current = bingPaintUrl;
  }, [bingPaintUrl]);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  useEffect(
    () => () => {
      revokeObjectUrlMaybe(bingPaintUrlRef.current);
      if (myLinesSaveTimerRef.current !== null) {
        window.clearTimeout(myLinesSaveTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const onStorageChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
      changes,
      areaName,
    ) => {
      if (areaName !== "local" && areaName !== "sync") return;
      if (!isTabocalypseSettingsStorageChange(changes, areaName)) return;
      void loadSettings().then((next) => {
        latestSettingsRef.current = next;
        setSettings(next);
      });
    };
    browser.storage.onChanged.addListener(onStorageChanged);
    return () => browser.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  useLayoutEffect(() => {
    applyDocumentTheme(settings.themeMode, settings.themePalette);
  }, [settings.themeMode, settings.themePalette]);

  useEffect(() => {
    const kind = settings?.backgroundKind;
    if (kind !== "bing") {
      setBingChosenUrl(null);
      setBingPaintUrl((prev) => {
        revokeObjectUrlMaybe(prev);
        return null;
      });
      setBingFetchErr(null);
      setBingImageLoadErr(null);
      setBingRefreshing(false);
      return;
    }
    const rotate = settings?.backgroundRotate ?? false;
    let cancelled = false;
    const listAbort = new AbortController();
    setBingChosenUrl(null);
    setBingPaintUrl((prev) => {
      revokeObjectUrlMaybe(prev);
      return null;
    });
    setBingFetchErr(null);
    setBingImageLoadErr(null);
    setBingRefreshing(false);
    void fetchBingWallpaperImageUrls(listAbort.signal)
      .then((urls) => {
        if (cancelled) return;
        if (urls.length === 0) {
          setBingFetchErr("No images returned.");
          return;
        }
        setBingChosenUrl(
          rotate ? pickRotatingBingWallpaperUrl(urls) : pickDailyBingWallpaperUrl(urls),
        );
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setBingFetchErr(e instanceof Error ? e.message : String(e));
      });
    if (!rotate) {
      return () => {
        cancelled = true;
        listAbort.abort();
      };
    }
    const id = window.setInterval(() => {
      setBingRefreshing(true);
      void fetchBingWallpaperImageUrls()
        .then((urls) => {
          if (cancelled) return;
          if (urls.length === 0) {
            setBingFetchErr("No images returned.");
            return;
          }
          setBingFetchErr(null);
          setBingChosenUrl(pickRotatingBingWallpaperUrl(urls));
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setBingFetchErr(e instanceof Error ? e.message : String(e));
        })
        .finally(() => {
          if (!cancelled) setBingRefreshing(false);
        });
    }, BING_ROTATE_MS);
    return () => {
      cancelled = true;
      listAbort.abort();
      window.clearInterval(id);
    };
  }, [settings?.backgroundKind, settings?.backgroundRotate]);

  useEffect(() => {
    if (settings?.backgroundKind !== "bing" || !bingChosenUrl) {
      setBingImageLoadErr(null);
      setBingPaintUrl((prev) => {
        revokeObjectUrlMaybe(prev);
        return null;
      });
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    setBingImageLoadErr(null);
    setBingPaintUrl((prev) => {
      revokeObjectUrlMaybe(prev);
      return null;
    });

    void privilegedExtensionFetchBytes(bingChosenUrl, ac.signal)
      .then(({ mime, bytes }) => {
        if (cancelled) return;
        const blob = new Blob([bytes], { type: mime || "image/jpeg" });
        const objectUrl = URL.createObjectURL(blob);
        setBingPaintUrl((prev) => {
          revokeObjectUrlMaybe(prev);
          return objectUrl;
        });
      })
      .catch((e: unknown) => {
        if (cancelled || ac.signal.aborted) return;
        setBingImageLoadErr(e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [settings?.backgroundKind, bingChosenUrl]);

  useEffect(() => {
    const kind = settings?.backgroundKind;
    if (kind !== "image") {
      setUserChosenUrl(null);
      return;
    }
    if (!settings) return;
    const picked = pickRotatingUrl(settings.userBackgroundDataUrls, settings.backgroundRotate);
    setUserChosenUrl(picked ?? settings.userBackgroundDataUrl ?? null);
    if (!settings.backgroundRotate) return;
    const id = window.setInterval(() => {
      const next = pickRotatingUrl(settings.userBackgroundDataUrls, true);
      setUserChosenUrl(next ?? settings.userBackgroundDataUrl ?? null);
    }, USER_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [
    settings,
    settings?.backgroundKind,
    settings?.backgroundRotate,
    settings?.userBackgroundDataUrl,
    settings?.userBackgroundDataUrls,
  ]);

  const clearMyLinesDebouncedSaveTimer = useCallback((): void => {
    if (myLinesSaveTimerRef.current === null) return;
    window.clearTimeout(myLinesSaveTimerRef.current);
    myLinesSaveTimerRef.current = null;
  }, []);

  const saveLatestToDisk = useCallback(async (): Promise<void> => {
    const cur = latestSettingsRef.current;
    try {
      await saveSettings(cur);
      setImportErr(null);
    } catch (e: unknown) {
      setImportErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const persist = useCallback(
    (next: TSettingsUpdater): Promise<void> => {
      const run = async () => {
        clearMyLinesDebouncedSaveTimer();
        const current = latestSettingsRef.current;
        const resolved = typeof next === "function" ? next(current) : next;
        latestSettingsRef.current = resolved;
        setSettings(resolved);
        try {
          await saveSettings(resolved);
          setImportErr(null);
        } catch (e: unknown) {
          setImportErr(e instanceof Error ? e.message : String(e));
        }
      };

      persistChainRef.current = persistChainRef.current.then(run).catch((e: unknown) => {
        setImportErr(e instanceof Error ? e.message : String(e));
      });
      return persistChainRef.current;
    },
    [clearMyLinesDebouncedSaveTimer],
  );

  const refreshOptionalApiPerms = useCallback(async (): Promise<void> => {
    try {
      const [topSites, bookmarks, tabs] = await Promise.all([
        browser.permissions.contains({ permissions: ["topSites"] }),
        browser.permissions.contains({ permissions: ["bookmarks"] }),
        browser.permissions.contains({ permissions: ["tabs"] }),
      ]);
      setOptionalApiPerms({ topSites, bookmarks, tabs });
    } catch {
      // Ignore: API unavailable in non-extension contexts.
    }
  }, []);

  useEffect(() => {
    if (!openSettings) return;
    void refreshOptionalApiPerms();
  }, [openSettings, refreshOptionalApiPerms]);

  const scheduleMyLinesPersist = useCallback(
    (myLines: string[]) => {
      const current = latestSettingsRef.current;
      const next = { ...current, myLines };
      latestSettingsRef.current = next;
      setSettings(next);

      if (myLinesSaveTimerRef.current !== null) {
        window.clearTimeout(myLinesSaveTimerRef.current);
      }
      myLinesSaveTimerRef.current = window.setTimeout(() => {
        myLinesSaveTimerRef.current = null;
        persistChainRef.current = persistChainRef.current
          .then(() => saveLatestToDisk())
          .catch((e: unknown) => {
            setImportErr(e instanceof Error ? e.message : String(e));
          });
      }, 300);
    },
    [saveLatestToDisk],
  );

  const humorCtx: IHumorContext = useMemo(
    () => ({
      humorEnabled: settings.humorEnabled,
      humorIntensity: settings.humorIntensity,
      enabledBuiltinPackIds: settings.humorBuiltinPackIds,
      importedPacks: settings.importedPacks,
      myLines: settings.myLines,
      locale: navigator.language,
    }),
    [settings],
  );

  const shellStyle = useMemo(
    () =>
      backgroundStyle(settings, {
        bingImageUrl: bingPaintUrl ?? bingChosenUrl,
        userImageUrl: userChosenUrl,
      }),
    [settings, bingChosenUrl, bingPaintUrl, userChosenUrl],
  );

  useLayoutEffect(() => {
    const html = document.documentElement;
    const bs = document.body;
    const { style: hs } = html;
    const { style: bsStyle } = bs;
    const prevHtml = hs.cssText;
    const prevBody = bsStyle.cssText;
    applyReactStyle(html, shellStyle);
    applyReactStyle(bs, shellStyle);
    hs.setProperty("min-height", "100%");
    bsStyle.setProperty("min-height", "100%");
    return () => {
      hs.cssText = prevHtml;
      bsStyle.cssText = prevBody;
    };
  }, [shellStyle]);

  const dailyLine = useMemo(() => pickDailyLine(humorCtx), [humorCtx]);

  const s = settings;

  const requestIntensity = (hi: THumorIntensity) => {
    void persist((cur) => {
      if ((hi === "spicy" || hi === "unhinged") && !cur.spicyContentAcknowledged) {
        setPendingIntensity(hi);
        setWarnSpicy(true);
        return cur;
      }
      return { ...cur, humorIntensity: hi };
    });
  };

  const confirmSpicy = () => {
    const hi = pendingIntensity ?? "spicy";
    void persist((cur) => ({ ...cur, spicyContentAcknowledged: true, humorIntensity: hi }));
    setWarnSpicy(false);
    setPendingIntensity(null);
  };

  const toggleWidget = (k: TWidgetKey, on: boolean) => {
    void persist((cur) => ({ ...cur, widgets: { ...cur.widgets, [k]: on } }));
  };

  const togglePack = (id: string, on: boolean) => {
    void persist((cur) => {
      const set = new Set(cur.humorBuiltinPackIds);
      if (on) set.add(id);
      else set.delete(id);
      return { ...cur, humorBuiltinPackIds: [...set] };
    });
  };

  const onPickBackgrounds = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = [...files];
    setImportErr(null);
    const dataUrls: string[] = [];
    for (const f of picked) {
      try {
        const url = await compressImageFileToDataUrl(f, {
          maxBytes: BG_MAX,
          maxEdgePx: BG_MAX_EDGE_PX,
        });
        dataUrls.push(url);
      } catch (e: unknown) {
        setImportErr(e instanceof Error ? e.message : String(e));
        return;
      }
    }
    const total = dataUrls.reduce((n, u) => n + estimateDataUrlBytes(u), 0);
    if (total > BG_TOTAL_MAX) {
      setImportErr(
        `After compressing on this device, images still exceed about ${BG_TOTAL_LABEL} total. Remove one file or pick smaller sources.`,
      );
      return;
    }
    const first = dataUrls[0] ?? null;
    void persist((cur) => ({
      ...cur,
      backgroundKind: "image",
      userBackgroundDataUrl: first,
      userBackgroundDataUrls: dataUrls,
    }));
  };

  const scheduleAlarm = async () => {
    const whenEl = document.getElementById("alarm-when") as HTMLInputElement | null;
    const msgEl = document.getElementById("alarm-msg") as HTMLInputElement | null;
    if (!whenEl?.value || !msgEl) return;
    const whenMs = new Date(whenEl.value).getTime();
    if (Number.isNaN(whenMs) || whenMs < Date.now()) {
      setImportErr("Pick a future time.");
      return;
    }
    const id = crypto.randomUUID();
    const name = `tabocalypse:${id}`;
    const metaKey = "alarmMeta";
    const cur = await browser.storage.local.get(metaKey);
    const meta = {
      ...(typeof cur[metaKey] === "object" && cur[metaKey] ? cur[metaKey] : {}),
      [name]: msgEl.value || "Tabocalypse alarm",
    };
    await browser.storage.local.set({ [metaKey]: meta });
    await browser.alarms.create(name, { when: whenMs });
    setImportErr(null);
    msgEl.value = "";
  };

  const runByoAiTest = async () => {
    setAiResult(null);
    if (!s.openaiApiKey) {
      setAiResult("Add an API key first.");
      return;
    }
    if (s.openaiBaseUrl.includes("api.openai.com")) {
      const granted = await browser.permissions.contains({
        origins: ["https://api.openai.com/*"],
      });
      if (!granted) {
        const ok = await browser.permissions.request({
          origins: ["https://api.openai.com/*"],
        });
        if (!ok) {
          setAiResult("Host permission denied for api.openai.com");
          return;
        }
      }
    }
    const r = await testOpenAiCompatible({
      apiKey: s.openaiApiKey,
      baseUrl: s.openaiBaseUrl,
    });
    setAiResult(r.ok ? r.reply : r.error);
  };

  const importPackFile = async (file: File) => {
    setImportErr(null);
    try {
      let pack;
      if (file.name.endsWith(".zip")) {
        pack = parseTabocalypseZip(await file.arrayBuffer());
      } else {
        pack = parsePackJsonText(await file.text());
      }
      void persist((cur) => {
        const nextPacks = cur.importedPacks.filter((p) => p.id !== pack.id).concat(pack);
        if (estimateImportedBytes(nextPacks) > MAX_TOTAL_IMPORTED_BYTES) {
          throw new Error("Imported packs exceed local quota. Remove a pack first.");
        }
        return { ...cur, importedPacks: nextPacks };
      });
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : String(e));
    }
  };

  const importPluginFile = async (file: File) => {
    setImportErr(null);
    setPluginValidateLog("");
    const text = await file.text();
    const r = validatePluginJsonText(text);
    if (!r.ok || !r.plugin) {
      setPluginValidateLog(r.errors.join("\n"));
      return;
    }
    const plugin = r.plugin;
    setPluginValidateLog([...r.errors, ...r.warnings.map((w) => `warning: ${w}`)].join("\n"));
    void persist((cur) => {
      const next = cur.importedPlugins.filter((p) => p.id !== plugin.id).concat(plugin);
      return { ...cur, importedPlugins: next };
    });
  };

  const exportSettingsJson = () => {
    const cur = latestSettingsRef.current ?? s;
    const blob = new Blob([JSON.stringify(cur, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tabocalypse-settings.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="shell">
      <div className="glitch-overlay" aria-hidden />
      {openSettings ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpenSettings(false)}>
          <div
            className="modal settings-modal"
            role="dialog"
            aria-label="Settings"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <h2>Settings</h2>
              <button
                type="button"
                className="btn ghost has-icon"
                onClick={() => setOpenSettings(false)}
              >
                <X size={18} strokeWidth={2} aria-hidden />
                <span>Close</span>
              </button>
            </header>
            <div className="modal-body">
              <div className="settings-accordion">
                <details className="acc-item" open>
                  <summary className="acc-summary">
                    <span className="acc-title">Presets</span>
                  </summary>
                  <div className="acc-body">
                    <div className="row wrap">
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() => void persist((cur) => applyPreset("focus", cur))}
                      >
                        <Target size={18} strokeWidth={2} aria-hidden />
                        <span>Focus</span>
                      </button>
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() => void persist((cur) => applyPreset("balanced", cur))}
                      >
                        <Scale size={18} strokeWidth={2} aria-hidden />
                        <span>Balanced</span>
                      </button>
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() => void persist((cur) => applyPreset("chaos", cur))}
                      >
                        <Flame size={18} strokeWidth={2} aria-hidden />
                        <span>Chaos</span>
                      </button>
                    </div>
                  </div>
                </details>

                <details className="acc-item">
                  <summary className="acc-summary">
                    <span className="acc-title">Appearance</span>
                  </summary>
                  <div className="acc-body">
                    <p className="muted sm mb-2">Base mode</p>
                    <div className="row wrap">
                      {THEME_MODES.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={s.themeMode === mode ? "btn primary has-icon" : "btn has-icon"}
                          onClick={() => void persist((cur) => ({ ...cur, themeMode: mode }))}
                        >
                          {mode === "dark" ? (
                            <Moon size={18} strokeWidth={2} aria-hidden />
                          ) : (
                            <Sun size={18} strokeWidth={2} aria-hidden />
                          )}
                          <span>{THEME_MODE_LABELS[mode]}</span>
                        </button>
                      ))}
                    </div>
                    <p className="muted sm mb-2 mt-4">Accent palette</p>
                    <div className="row wrap">
                      {THEME_PALETTES.map((palette) => (
                        <button
                          key={palette}
                          type="button"
                          className={s.themePalette === palette ? "btn primary" : "btn"}
                          onClick={() => void persist((cur) => ({ ...cur, themePalette: palette }))}
                        >
                          {THEME_PALETTE_LABELS[palette]}
                        </button>
                      ))}
                    </div>
                  </div>
                </details>

                <details className="acc-item">
                  <summary className="acc-summary">
                    <span className="acc-title">Widgets</span>
                  </summary>
                  <div className="acc-body">
                    {(Object.keys(s.widgets) as TWidgetKey[]).map((k) => (
                      <label key={k} className="check-row">
                        <input
                          type="checkbox"
                          checked={s.widgets[k]}
                          onChange={(e) => toggleWidget(k, e.target.checked)}
                        />
                        <span>{WIDGET_LABELS[k]}</span>
                      </label>
                    ))}
                  </div>
                </details>

                <details className="acc-item">
                  <summary className="acc-summary">
                    <span className="acc-title">Chaos</span>
                  </summary>
                  <div className="acc-body">
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={s.humorEnabled}
                        onChange={(e) =>
                          void persist((cur) => ({ ...cur, humorEnabled: e.target.checked }))
                        }
                      />
                      <span>Humor on</span>
                    </label>
                    <label className="block">
                      Intensity
                      <select
                        value={s.humorIntensity}
                        onChange={(e) => requestIntensity(e.target.value as THumorIntensity)}
                      >
                        <option value="off">off</option>
                        <option value="mild">mild</option>
                        <option value="spicy">spicy</option>
                        <option value="unhinged">unhinged</option>
                      </select>
                    </label>
                    <p className="muted sm">Builtin packs (filtered for built-in lines only):</p>
                    {BUILTIN_PACKS.map((p) => (
                      <label key={p.id} className="check-row">
                        <input
                          type="checkbox"
                          checked={s.humorBuiltinPackIds.includes(p.id)}
                          onChange={(e) => togglePack(p.id, e.target.checked)}
                        />
                        <span>
                          {p.name} <span className="muted sm">({p.maxIntensity})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </details>

                <details className="acc-item">
                  <summary className="acc-summary">
                    <span className="acc-title">Search engine</span>
                  </summary>
                  <div className="acc-body">
                    <select
                      value={s.searchEngine}
                      onChange={(e) =>
                        void persist((cur) => ({
                          ...cur,
                          searchEngine: e.target.value as ISettings["searchEngine"],
                        }))
                      }
                    >
                      <option value="ddg">DuckDuckGo</option>
                      <option value="google">Google</option>
                      <option value="bing">Bing</option>
                    </select>
                  </div>
                </details>

                <details className="acc-item">
                  <summary className="acc-summary">
                    <span className="acc-title">Background</span>
                  </summary>
                  <div className="acc-body">
                    <div className="row wrap">
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() => void persist((cur) => ({ ...cur, backgroundKind: "solid" }))}
                      >
                        <Square size={18} strokeWidth={2} aria-hidden />
                        <span>Solid</span>
                      </button>
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() =>
                          void persist((cur) => ({ ...cur, backgroundKind: "gradient" }))
                        }
                      >
                        <Paintbrush size={18} strokeWidth={2} aria-hidden />
                        <span>Gradient</span>
                      </button>
                      <label className="btn has-icon">
                        <ImagePlus size={18} strokeWidth={2} aria-hidden />
                        <span>Upload image(s)</span>
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => void onPickBackgrounds(e.target.files)}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() => void persist((cur) => ({ ...cur, backgroundKind: "bing" }))}
                      >
                        <Images size={18} strokeWidth={2} aria-hidden />
                        <span>Bing spotlight</span>
                      </button>
                    </div>

                    <label className="check-row mt-3">
                      <input
                        type="checkbox"
                        checked={s.backgroundRotate}
                        onChange={(e) =>
                          void persist((cur) => ({ ...cur, backgroundRotate: e.target.checked }))
                        }
                      />
                      <span>Rotate background</span>
                    </label>
                    <p className="muted sm">
                      Upload rotation changes every ~15 minutes while this tab is open.
                    </p>
                    <p className="muted sm">
                      Local uploads are resized and compressed in your browser before saving (about{" "}
                      {BG_MAX_LABEL} stored per image, about {BG_TOTAL_LABEL} total per
                      multi-select). Large originals are shrunk to fit extension storage.
                    </p>
                    {s.backgroundKind === "bing" && s.backgroundRotate ? (
                      <p className="muted sm">
                        Bing rotation refreshes about every {BING_ROTATE_MS / 60_000} minutes while
                        this tab stays open.
                      </p>
                    ) : null}

                    {s.backgroundKind === "bing" && !bingFetchErr && !bingImageLoadErr ? (
                      <p className="muted sm" role="status">
                        {bingChosenUrl
                          ? bingPaintUrl
                            ? bingRefreshing
                              ? "Refreshing Bing spotlight…"
                              : "Bing spotlight loaded."
                            : "Preparing Bing image…"
                          : "Loading Bing spotlight…"}
                      </p>
                    ) : null}
                    {s.backgroundKind === "bing" && bingFetchErr ? (
                      <p className="muted sm" role="status">
                        Bing list: {bingFetchErr}
                      </p>
                    ) : null}
                    {s.backgroundKind === "bing" && bingImageLoadErr ? (
                      <p className="muted sm" role="status">
                        Bing image: {bingImageLoadErr}
                      </p>
                    ) : null}

                    <label className="block">
                      Solid color
                      <input
                        type="color"
                        value={s.backgroundSolid}
                        onChange={(e) =>
                          void persist((cur) => ({ ...cur, backgroundSolid: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                </details>

                <section className="settings-block">
                  <h3>Weather location</h3>
                  <button
                    type="button"
                    className="btn has-icon"
                    onClick={() => {
                      if (!navigator.geolocation) return;
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          void persist((cur) => ({
                            ...cur,
                            weatherLat: pos.coords.latitude,
                            weatherLon: pos.coords.longitude,
                          }));
                        },
                        () => undefined,
                      );
                    }}
                  >
                    <MapPin size={18} strokeWidth={2} aria-hidden />
                    <span>Use my location (once)</span>
                  </button>
                  <div className="row">
                    <label className="block">
                      Lat
                      <input
                        type="number"
                        step="0.01"
                        value={s.weatherLat}
                        onChange={(e) =>
                          void persist((cur) => ({ ...cur, weatherLat: Number(e.target.value) }))
                        }
                      />
                    </label>
                    <label className="block">
                      Lon
                      <input
                        type="number"
                        step="0.01"
                        value={s.weatherLon}
                        onChange={(e) =>
                          void persist((cur) => ({ ...cur, weatherLon: Number(e.target.value) }))
                        }
                      />
                    </label>
                  </div>
                </section>

                <section className="settings-block">
                  <h3>Optional permissions</h3>
                  <div className="row wrap">
                    <button
                      type="button"
                      className="btn has-icon"
                      aria-label={
                        optionalApiPerms.topSites
                          ? "Disable Top sites permission"
                          : "Enable Top sites permission"
                      }
                      onClick={async () => {
                        if (optionalApiPerms.topSites) {
                          const ok = await browser.permissions.remove({
                            permissions: ["topSites"],
                          });
                          if (ok) {
                            await persist((cur) => ({
                              ...cur,
                              widgets: { ...cur.widgets, topSites: false },
                            }));
                          }
                        } else {
                          const ok = await browser.permissions.request({
                            permissions: ["topSites"],
                          });
                          if (ok) {
                            await persist((cur) => ({
                              ...cur,
                              widgets: { ...cur.widgets, topSites: true },
                            }));
                          }
                        }
                        void refreshOptionalApiPerms();
                      }}
                    >
                      <LayoutGrid size={18} strokeWidth={2} aria-hidden />
                      <span>
                        {optionalApiPerms.topSites ? "Disable Top sites" : "Enable Top sites"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="btn has-icon"
                      aria-label={
                        optionalApiPerms.bookmarks
                          ? "Disable Bookmarks permission"
                          : "Enable Bookmarks permission"
                      }
                      onClick={async () => {
                        if (optionalApiPerms.bookmarks) {
                          const ok = await browser.permissions.remove({
                            permissions: ["bookmarks"],
                          });
                          if (ok) {
                            await persist((cur) => ({
                              ...cur,
                              widgets: { ...cur.widgets, bookmarksStrip: false },
                            }));
                          }
                        } else {
                          const ok = await browser.permissions.request({
                            permissions: ["bookmarks"],
                          });
                          if (ok) {
                            await persist((cur) => ({
                              ...cur,
                              widgets: { ...cur.widgets, bookmarksStrip: true },
                            }));
                          }
                        }
                        void refreshOptionalApiPerms();
                      }}
                    >
                      <Bookmark size={18} strokeWidth={2} aria-hidden />
                      <span>
                        {optionalApiPerms.bookmarks ? "Disable Bookmarks" : "Enable Bookmarks"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="btn has-icon"
                      aria-label={
                        optionalApiPerms.tabs
                          ? "Disable Tab guilt (tabs) permission"
                          : "Enable Tab guilt (tabs) permission"
                      }
                      onClick={async () => {
                        if (optionalApiPerms.tabs) {
                          const ok = await browser.permissions.remove({ permissions: ["tabs"] });
                          if (ok) {
                            await persist((cur) => ({
                              ...cur,
                              widgets: { ...cur.widgets, tabGuilt: false },
                            }));
                          }
                        } else {
                          const ok = await browser.permissions.request({ permissions: ["tabs"] });
                          if (ok) {
                            await persist((cur) => ({
                              ...cur,
                              widgets: { ...cur.widgets, tabGuilt: true },
                            }));
                          }
                        }
                        void refreshOptionalApiPerms();
                      }}
                    >
                      <Layers size={18} strokeWidth={2} aria-hidden />
                      <span>
                        {optionalApiPerms.tabs
                          ? "Disable Tab guilt (tabs)"
                          : "Enable Tab guilt (tabs)"}
                      </span>
                    </button>
                  </div>
                </section>

                <section className="settings-block">
                  <h3>Alarm (notification)</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void scheduleAlarm();
                    }}
                  >
                    <input id="alarm-when" type="datetime-local" />
                    <input
                      id="alarm-msg"
                      type="text"
                      placeholder="Message"
                      className="mt-2 w-full"
                    />
                    <button type="submit" className="btn primary has-icon mt-2">
                      <CalendarClock size={20} strokeWidth={2} aria-hidden />
                      <span>Schedule</span>
                    </button>
                  </form>
                </section>

                <section className="settings-block">
                  <h3>BYO AI (OpenAI-compatible)</h3>
                  <p className="muted sm">
                    You pay your provider. Nothing is sent without your key.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void runByoAiTest();
                    }}
                  >
                    <input
                      placeholder="API key"
                      type="password"
                      autoComplete="off"
                      value={s.openaiApiKey}
                      onChange={(e) =>
                        void persist((cur) => ({ ...cur, openaiApiKey: e.target.value }))
                      }
                      className="w-full"
                    />
                    <input
                      placeholder="Base URL"
                      value={s.openaiBaseUrl}
                      onChange={(e) =>
                        void persist((cur) => ({ ...cur, openaiBaseUrl: e.target.value }))
                      }
                      className="mt-2 w-full"
                    />
                    <button type="submit" className="btn has-icon mt-2">
                      <Sparkles size={18} strokeWidth={2} aria-hidden />
                      <span>Test chat completion</span>
                    </button>
                  </form>
                  {aiResult ? <pre className="ai-out">{aiResult}</pre> : null}
                </section>

                <section className="settings-block">
                  <h3>My lines (local)</h3>
                  <textarea
                    rows={4}
                    className="w-full"
                    placeholder="One joke per line — saved as you type"
                    value={s.myLines.join("\n")}
                    onChange={(e) =>
                      scheduleMyLinesPersist(
                        e.target.value
                          .split("\n")
                          .map((x) => x.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </section>

                <section className="settings-block">
                  <h3>Import pack (.zip with pack.json or .json)</h3>
                  <label className="btn has-icon">
                    <FolderUp size={18} strokeWidth={2} aria-hidden />
                    <span>Choose file</span>
                    <input
                      hidden
                      type="file"
                      accept=".zip,.json,application/json"
                      onChange={(e) => void importPackFile(e.target.files![0]!)}
                    />
                  </label>
                  <p className="muted sm">You are responsible for imported content.</p>
                </section>

                <section className="settings-block">
                  <h3>Import declarative plugin (tabocalypse-plugin.json)</h3>
                  <label className="btn has-icon">
                    <Braces size={18} strokeWidth={2} aria-hidden />
                    <span>Choose JSON</span>
                    <input
                      hidden
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => void importPluginFile(e.target.files![0]!)}
                    />
                  </label>
                  <textarea readOnly rows={3} className="mt-2 w-full" value={pluginValidateLog} />
                </section>

                <section className="settings-block">
                  <h3>Manage imports</h3>
                  <p className="muted sm">Packs</p>
                  {s.importedPacks.map((p) => (
                    <div key={p.id} className="row manage-row">
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={p.enabled}
                          onChange={(e) =>
                            void persist((cur) => ({
                              ...cur,
                              importedPacks: cur.importedPacks.map((x) =>
                                x.id === p.id ? { ...x, enabled: e.target.checked } : x,
                              ),
                            }))
                          }
                        />
                        <span>{p.name}</span>
                      </label>
                      <button
                        type="button"
                        className="btn ghost sm has-icon"
                        onClick={() =>
                          void persist((cur) => ({
                            ...cur,
                            importedPacks: cur.importedPacks.filter((x) => x.id !== p.id),
                          }))
                        }
                      >
                        <Trash2 size={18} strokeWidth={2} aria-hidden />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                  <p className="muted sm">Plugins</p>
                  {s.importedPlugins.map((p) => (
                    <div key={p.id} className="row manage-row">
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={p.enabled}
                          onChange={(e) =>
                            void persist((cur) => ({
                              ...cur,
                              importedPlugins: cur.importedPlugins.map((x) =>
                                x.id === p.id ? { ...x, enabled: e.target.checked } : x,
                              ),
                            }))
                          }
                        />
                        <span>{p.name}</span>
                      </label>
                      <button
                        type="button"
                        className="btn ghost sm has-icon"
                        onClick={() =>
                          void persist((cur) => ({
                            ...cur,
                            importedPlugins: cur.importedPlugins.filter((x) => x.id !== p.id),
                          }))
                        }
                      >
                        <Trash2 size={18} strokeWidth={2} aria-hidden />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </section>

                <section className="settings-block">
                  <h3>Debug</h3>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={s.debugPluginSource}
                      onChange={(e) =>
                        void persist((cur) => ({ ...cur, debugPluginSource: e.target.checked }))
                      }
                    />
                    <span>Show plugin widget types</span>
                  </label>
                </section>

                <section className="settings-block">
                  <h3>Data</h3>
                  <button type="button" className="btn has-icon" onClick={exportSettingsJson}>
                    <Download size={18} strokeWidth={2} aria-hidden />
                    <span>Export settings JSON</span>
                  </button>
                  <label className="btn has-icon ml-2">
                    <Upload size={18} strokeWidth={2} aria-hidden />
                    <span>Import settings JSON</span>
                    <input
                      hidden
                      type="file"
                      accept="application/json"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          try {
                            const parsed = JSON.parse(String(reader.result)) as Partial<ISettings>;
                            const d = defaultSettings();
                            const merged: ISettings = {
                              ...d,
                              ...parsed,
                              version: 1,
                              widgets: { ...d.widgets, ...(parsed.widgets ?? {}) },
                              themeMode: coerceThemeMode(parsed.themeMode, d.themeMode),
                              themePalette: coerceThemePalette(parsed.themePalette, d.themePalette),
                            };
                            void persist(merged);
                          } catch {
                            setImportErr("Invalid settings JSON");
                          }
                        };
                        reader.readAsText(f);
                      }}
                    />
                  </label>
                </section>

                <section className="settings-block support-block">
                  <h3>Fuel the chaos / Ideas</h3>
                  <p className="muted sm">
                    Optional support — opens third-party sites. Tabocalypse does not process
                    payments.
                  </p>
                  <div className="row wrap">
                    {SUPPORT.featureUrl ? (
                      <button
                        type="button"
                        className="btn primary has-icon"
                        onClick={() => openExternal(SUPPORT.featureUrl)}
                      >
                        <Lightbulb size={18} strokeWidth={2} aria-hidden />
                        <span>Suggest a feature</span>
                      </button>
                    ) : null}
                    {SUPPORT.donateUrl ? (
                      <button
                        type="button"
                        className="btn has-icon"
                        onClick={() => openExternal(SUPPORT.donateUrl)}
                      >
                        <Heart size={18} strokeWidth={2} aria-hidden />
                        <span>Donate</span>
                      </button>
                    ) : null}
                    {SUPPORT.githubUrl ? (
                      <button
                        type="button"
                        className="btn ghost has-icon"
                        onClick={() => openExternal(SUPPORT.githubUrl)}
                      >
                        <ExternalLink size={18} strokeWidth={2} aria-hidden />
                        <span>GitHub</span>
                      </button>
                    ) : null}
                  </div>
                  <p className="muted sm">
                    Set <code>WXT_TABOCALYPSE_FEATURE_URL</code>,{" "}
                    <code>WXT_TABOCALYPSE_DONATE_URL</code>, <code>WXT_TABOCALYPSE_GITHUB_URL</code>{" "}
                    in <code>.env</code>.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {warnSpicy ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal small flex flex-col gap-4 p-6"
            role="dialog"
            aria-label="Content notice"
          >
            <h2>Turn it up?</h2>
            <p>
              Spicy and unhinged modes may include swearing or abrasive humor in curated packs. You
              are responsible for imported content.
            </p>
            <div className="row justify-end gap-2">
              <button
                type="button"
                className="btn ghost has-icon"
                onClick={() => setWarnSpicy(false)}
              >
                <CircleX size={18} strokeWidth={2} aria-hidden />
                <span>Cancel</span>
              </button>
              <button type="button" className="btn primary has-icon" onClick={() => confirmSpicy()}>
                <CheckCircle2 size={18} strokeWidth={2} aria-hidden />
                <span>I understand</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="top-bar">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="title">Tabocalypse</h1>
            <p className="tagline">SYSTEM_STABLE: FALSE</p>
          </div>
        </div>
        {s.widgets.search ? <SearchWidget engine={s.searchEngine} variant="header" /> : null}
        <button
          type="button"
          className="btn primary icon-only"
          aria-label="Settings"
          title="Settings"
          onClick={() => setOpenSettings(true)}
        >
          <SettingsIcon size={20} strokeWidth={2} aria-hidden />
        </button>
      </header>

      {importErr ? <div className="toast err">{importErr}</div> : null}

      {s.widgets.humorBanner && dailyLine ? (
        <div className="humor-banner">
          <span>{dailyLine}</span>
        </div>
      ) : null}

      {s.widgets.productivityGag ? (
        <div className="prod-gag muted">
          Fake productivity score: <strong>{prodScore}</strong> — purely ceremonial.
        </div>
      ) : null}

      <main className="hud-main">
        <div className="hud-grid">
          <div className="hud-left space-y-6">
            {s.widgets.todo ? (
              <TodoWidget
                items={s.todos}
                onChange={(todos) => void persist((cur) => ({ ...cur, todos }))}
              />
            ) : null}
            {s.widgets.clock ? <ClockWidget humor={humorCtx} /> : null}
            {s.widgets.tabGuilt ? <TabGuilt /> : null}
          </div>

          <div className="hud-center space-y-6">
            {s.widgets.weather ? <WeatherWidget lat={s.weatherLat} lon={s.weatherLon} /> : null}
            {s.widgets.topSites ? <TopSitesWidget /> : null}
            {s.widgets.bookmarksStrip ? <BookmarksWidget /> : null}
            <PluginDeck plugins={s.importedPlugins} debug={s.debugPluginSource} />
          </div>

          <div className="hud-right space-y-6">
            {s.widgets.notes ? (
              <NotesWidget
                value={s.notesText}
                onChange={(notesText) => void persist((cur) => ({ ...cur, notesText }))}
              />
            ) : null}
          </div>
        </div>
      </main>

      <footer className="footer muted sm">
        <span>{humorCtx.humorEnabled ? (dailyLine ?? "…") : "Focus mode engaged."}</span>
        <div className="row gap-3">
          {SUPPORT.featureUrl ? (
            <button
              type="button"
              className="linkish"
              onClick={() => openExternal(SUPPORT.featureUrl)}
            >
              Ideas
            </button>
          ) : null}
          {SUPPORT.donateUrl ? (
            <button
              type="button"
              className="linkish"
              onClick={() => openExternal(SUPPORT.donateUrl)}
            >
              Donate
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

function TabGuilt() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const tabs = browser.tabs;
    if (!tabs?.query) {
      setN(null);
      return;
    }
    void tabs
      .query({ currentWindow: true })
      .then((t) => setN(t.length))
      .catch(() => setN(null));
  }, []);
  if (n === null)
    return (
      <section className="card">
        <h3>Tab guilt</h3>
        <p className="muted">Grant tabs permission in settings.</p>
      </section>
    );
  const msg =
    n < 8
      ? "Reasonable tab footprint. Suspiciously responsible."
      : "Tab count entering folklore territory.";
  return (
    <section className="card">
      <h3>Tab guilt</h3>
      <p className="tab-count">{n} tabs in this window.</p>
      <p className="muted">{msg}</p>
    </section>
  );
}
