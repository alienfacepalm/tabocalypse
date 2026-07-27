/** Origin pattern for `browser.permissions` from an OpenAI-compatible base URL. */
export function byoAiHostOriginPattern(baseUrl: string): string | null {
  try {
    const u = new URL(baseUrl.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return `${u.origin}/*`;
  } catch {
    return null;
  }
}

export function byoAiHostPermissionHostname(baseUrl: string): string | null {
  try {
    return new URL(baseUrl.trim()).hostname;
  } catch {
    return null;
  }
}

function isLocalByoAiHttpHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Guards host permission requests: HTTPS everywhere; HTTP only on localhost. */
export function validateByoAiBaseUrlForPermission(
  baseUrl: string,
): { ok: true } | { ok: false; error: string } {
  try {
    const u = new URL(baseUrl.trim());
    if (u.protocol === "https:") return { ok: true };
    if (u.protocol === "http:" && isLocalByoAiHttpHost(u.hostname)) return { ok: true };
    if (u.protocol === "http:") {
      return {
        ok: false,
        error: "Use HTTPS for remote API base URLs (http:// is only allowed on localhost).",
      };
    }
    return {
      ok: false,
      error: "Enter a valid HTTPS base URL (http://localhost is allowed for local models).",
    };
  } catch {
    return {
      ok: false,
      error: "Enter a valid HTTPS base URL (http://localhost is allowed for local models).",
    };
  }
}
