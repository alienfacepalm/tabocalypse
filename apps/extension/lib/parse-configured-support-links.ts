/** Drives default icon choice in the settings “Feedback and support” form (build-time JSON only). */
export type TSupportLinkKind = "feedback" | "donate" | "source" | "link";

export interface ISupportAction {
  label: string;
  url: string;
  kind: TSupportLinkKind;
}

const SUPPORT_LINK_KINDS: readonly TSupportLinkKind[] = ["feedback", "donate", "source", "link"];

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function coerceKind(value: unknown): TSupportLinkKind {
  if (typeof value === "string" && (SUPPORT_LINK_KINDS as readonly string[]).includes(value)) {
    return value as TSupportLinkKind;
  }
  return "link";
}

/**
 * Parses `WXT_TABOCALYPSE_SUPPORT_LINKS` JSON.
 * Returns `null` if the string is not a JSON array (caller may fall back to legacy URLs).
 */
export function parseConfiguredSupportLinks(raw: string): ISupportAction[] | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const data: unknown = JSON.parse(trimmed);
    if (!Array.isArray(data)) return null;
    const out: ISupportAction[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const label = typeof rec.label === "string" ? rec.label.trim() : "";
      const url = typeof rec.url === "string" ? rec.url.trim() : "";
      if (!label || !isHttpUrl(url)) continue;
      out.push({ label, url, kind: coerceKind(rec.kind) });
    }
    return out;
  } catch {
    return null;
  }
}
