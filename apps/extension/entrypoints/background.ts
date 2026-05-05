import { defineBackground } from "wxt/sandbox";
import browser from "webextension-polyfill";
import { ALARM_PREFIX, META_KEY, removeAlarmMeta, type TAlarmMeta } from "../lib/alarm-meta";
import { coerceAlarmMetaMessage } from "../lib/alarm-meta-message";
import {
  arrayBufferToBase64,
  isPrivilegedExtensionFetchUrlAllowed,
  TABOCALYPSE_PRIV_FETCH_BYTES,
  TABOCALYPSE_PRIV_FETCH_JSON,
  type TPrivilegedFetchBytesResponse,
  type TPrivilegedFetchJsonResponse,
} from "../lib/privileged-extension-fetch";

async function getMeta(): Promise<TAlarmMeta> {
  const r = await browser.storage.local.get(META_KEY);
  return ((r[META_KEY] as TAlarmMeta) ?? {}) as TAlarmMeta;
}

async function privilegedFetchJsonInBackground(url: string): Promise<TPrivilegedFetchJsonResponse> {
  if (!isPrivilegedExtensionFetchUrlAllowed(url)) {
    return { ok: false, error: "URL not allowlisted for privileged fetch." };
  }
  try {
    const res = await fetch(url, { credentials: "omit", cache: "no-store" });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data: unknown = await res.json();
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function privilegedFetchBytesInBackground(
  url: string,
): Promise<TPrivilegedFetchBytesResponse> {
  if (!isPrivilegedExtensionFetchUrlAllowed(url)) {
    return { ok: false, error: "URL not allowlisted for privileged fetch." };
  }
  try {
    const res = await fetch(url, { credentials: "omit", cache: "no-store" });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const mime = res.headers.get("content-type") ?? "application/octet-stream";
    const buf = await res.arrayBuffer();
    return { ok: true, base64: arrayBufferToBase64(buf), mime };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!message || typeof message !== "object" || !("type" in message)) return undefined;
    const m = message as { type: unknown; url?: unknown };
    if (m.type === TABOCALYPSE_PRIV_FETCH_JSON && typeof m.url === "string") {
      return privilegedFetchJsonInBackground(m.url);
    }
    if (m.type === TABOCALYPSE_PRIV_FETCH_BYTES && typeof m.url === "string") {
      return privilegedFetchBytesInBackground(m.url);
    }
    return undefined;
  });

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (!alarm.name.startsWith(ALARM_PREFIX)) return;
    const meta = await getMeta();
    const message = coerceAlarmMetaMessage(meta[alarm.name]) || "Tabocalypse alarm.";
    await browser.storage.local.set({ [META_KEY]: removeAlarmMeta(meta, alarm.name) });

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
