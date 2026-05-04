import browser from "webextension-polyfill";

/** Must stay aligned with `host_permissions` in `wxt.config.ts` (HTTPS prefixes only). */
const ALLOWED_URL_PREFIXES = [
  "https://peapix.com/",
  "https://img.peapix.com/",
  "https://api.open-meteo.com/",
] as const;

export const TABOCALYPSE_PRIV_FETCH_JSON = "tabocalypse/privilegedFetchJson" as const;
export const TABOCALYPSE_PRIV_FETCH_BYTES = "tabocalypse/privilegedFetchBytes" as const;

export type TPrivilegedFetchJsonRequest = {
  type: typeof TABOCALYPSE_PRIV_FETCH_JSON;
  url: string;
};

export type TPrivilegedFetchBytesRequest = {
  type: typeof TABOCALYPSE_PRIV_FETCH_BYTES;
  url: string;
};

export type TPrivilegedFetchJsonResponse =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export type TPrivilegedFetchBytesResponse =
  | { ok: true; base64: string; mime: string }
  | { ok: false; error: string };

export function isPrivilegedExtensionFetchUrlAllowed(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
  } catch {
    return false;
  }
}

/** Used by the service worker to return binary bodies over `runtime.sendMessage`. */
export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function raceAbort<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
  if (!signal) return promise;
  let detach: (() => void) | undefined;
  const aborted = new Promise<never>((_, rej) => {
    const onAbort = (): void => {
      rej(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort);
    detach = () => signal.removeEventListener("abort", onAbort);
  });
  try {
    return await Promise.race([promise, aborted]);
  } finally {
    detach?.();
  }
}

function useBackgroundPrivilegedFetch(): boolean {
  try {
    return Boolean(
      typeof browser !== "undefined" &&
      typeof browser.runtime?.sendMessage === "function" &&
      Boolean(browser.runtime.id),
    );
  } catch {
    return false;
  }
}

export async function privilegedExtensionFetchJson(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  if (!isPrivilegedExtensionFetchUrlAllowed(url)) {
    throw new Error("URL is not allowlisted for privileged extension fetch.");
  }
  if (!useBackgroundPrivilegedFetch()) {
    const res = await fetch(url, { signal, credentials: "omit", cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<unknown>;
  }
  const pending = browser.runtime.sendMessage({
    type: TABOCALYPSE_PRIV_FETCH_JSON,
    url,
  } satisfies TPrivilegedFetchJsonRequest) as Promise<TPrivilegedFetchJsonResponse>;
  const raced = await raceAbort(pending, signal);
  if (!raced.ok) throw new Error(raced.error);
  return raced.data;
}

export async function privilegedExtensionFetchBytes(
  url: string,
  signal?: AbortSignal,
): Promise<{ mime: string; bytes: ArrayBuffer }> {
  if (!isPrivilegedExtensionFetchUrlAllowed(url)) {
    throw new Error("URL is not allowlisted for privileged extension fetch.");
  }
  if (!useBackgroundPrivilegedFetch()) {
    const res = await fetch(url, { signal, credentials: "omit", cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mime = res.headers.get("content-type") ?? "application/octet-stream";
    const bytes = await res.arrayBuffer();
    return { mime, bytes };
  }
  const pending = browser.runtime.sendMessage({
    type: TABOCALYPSE_PRIV_FETCH_BYTES,
    url,
  } satisfies TPrivilegedFetchBytesRequest) as Promise<TPrivilegedFetchBytesResponse>;
  const raced = await raceAbort(pending, signal);
  if (!raced.ok) throw new Error(raced.error);
  const bytes = base64ToArrayBuffer(raced.base64);
  return { mime: raced.mime, bytes };
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out.buffer;
}
