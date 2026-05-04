import { defineBackground } from "wxt/sandbox";
import browser from "webextension-polyfill";
import {
  BING_HP_ARCHIVE,
  TABOCALYPSE_BING_WALLPAPER_URLS_MESSAGE,
  wallpaperUrlsFromBingArchiveJson,
} from "../lib/fetch-bing-wallpaper";

const ALARM_PREFIX = "tabocalypse:";
const META_KEY = "alarmMeta";

type TAlarmMeta = Record<string, string>;

type TBingWallpaperUrlsResponse = { ok: true; urls: string[] } | { ok: false; error: string };

async function getMeta(): Promise<TAlarmMeta> {
  const r = await browser.storage.local.get(META_KEY);
  return ((r[META_KEY] as TAlarmMeta) ?? {}) as TAlarmMeta;
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    async (message: unknown): Promise<TBingWallpaperUrlsResponse | void> => {
      if (typeof message !== "object" || message === null) return;
      const type = (message as { type?: unknown }).type;
      if (type !== TABOCALYPSE_BING_WALLPAPER_URLS_MESSAGE) return;

      try {
        const res = await fetch(BING_HP_ARCHIVE);
        if (!res.ok) return { ok: false, error: `Bing wallpaper HTTP ${res.status}` };
        const data: unknown = await res.json();
        const urls = wallpaperUrlsFromBingArchiveJson(data);
        return { ok: true, urls };
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
  );

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (!alarm.name.startsWith(ALARM_PREFIX)) return;
    const meta = await getMeta();
    const message = meta[alarm.name] ?? "Tabocalypse alarm.";
    const { [alarm.name]: _, ...rest } = meta;
    await browser.storage.local.set({ [META_KEY]: rest });

    try {
      await browser.notifications.create(`tabocalypse-${alarm.name}`, {
        type: "basic",
        title: "Tabocalypse",
        message,
      });
    } catch {
      // notifications may fail without permission on some builds
    }
  });
});
