import {
  arrayBufferToBase64,
  isPrivilegedExtensionFetchUrlAllowed,
  normalizePrivilegedExtensionFetchUrl,
  PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND,
  type TPrivilegedFetchBytesResponse,
  type TPrivilegedFetchJsonResponse,
  type TPrivilegedFetchTextResponse,
} from "./privileged-extension-fetch";

function resolvePrivilegedFetchUrl(url: string): string | null {
  try {
    const normalized = normalizePrivilegedExtensionFetchUrl(url);
    return isPrivilegedExtensionFetchUrlAllowed(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export async function privilegedFetchJsonInBackground(
  url: string,
  headers?: Record<string, string>,
): Promise<TPrivilegedFetchJsonResponse> {
  const normalizedUrl = resolvePrivilegedFetchUrl(url);
  if (!normalizedUrl) {
    return { ok: false, error: PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND };
  }
  try {
    const res = await fetch(normalizedUrl, {
      credentials: "omit",
      cache: "no-store",
      ...(headers ? { headers } : {}),
    });
    if (!res.ok) {
      let error = `HTTP ${res.status}`;
      try {
        const body: unknown = await res.json();
        if (body != null && typeof body === "object" && !Array.isArray(body)) {
          const row = body as Record<string, unknown>;
          if (typeof row.message === "string" && row.message.trim().length > 0) {
            error = row.message.trim();
          }
        }
      } catch {
        // keep HTTP status fallback
      }
      return { ok: false, error };
    }
    const data: unknown = await res.json();
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function privilegedFetchTextInBackground(
  url: string,
  headers?: Record<string, string>,
): Promise<TPrivilegedFetchTextResponse> {
  const normalizedUrl = resolvePrivilegedFetchUrl(url);
  if (!normalizedUrl) {
    return { ok: false, error: PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND };
  }
  try {
    const res = await fetch(normalizedUrl, {
      credentials: "omit",
      cache: "no-store",
      ...(headers ? { headers } : {}),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const text = await res.text();
    return { ok: true, text };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function privilegedFetchBytesInBackground(
  url: string,
): Promise<TPrivilegedFetchBytesResponse> {
  const normalizedUrl = resolvePrivilegedFetchUrl(url);
  if (!normalizedUrl) {
    return { ok: false, error: PRIV_FETCH_ALLOWLIST_ERROR_BACKGROUND };
  }
  try {
    const res = await fetch(normalizedUrl, { credentials: "omit", cache: "no-store" });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const mime = res.headers.get("content-type") ?? "application/octet-stream";
    const buf = await res.arrayBuffer();
    return { ok: true, base64: arrayBufferToBase64(buf), mime };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
