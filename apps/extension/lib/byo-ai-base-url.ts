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
