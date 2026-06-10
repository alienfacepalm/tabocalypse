const OG_IMAGE_META_RE =
  /<meta[^>]+(?:property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["'])/i;
const TWITTER_IMAGE_META_RE =
  /<meta[^>]+(?:name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'])/i;

function normalizeImageUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return null;
}

/** Extracts Open Graph or Twitter card image URL from article HTML. */
export function parseOgImageFromHtml(html: string): string | null {
  if (!html || html.length === 0) return null;
  for (const re of [OG_IMAGE_META_RE, TWITTER_IMAGE_META_RE]) {
    const match = html.match(re);
    if (!match) continue;
    const candidate = match[1] ?? match[2];
    if (typeof candidate !== "string") continue;
    const url = normalizeImageUrl(candidate);
    if (url) return url;
  }
  return null;
}
