export function faviconUrl(pageUrl: string): string {
  return `https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(pageUrl)}`;
}

/** Larger publisher icon for HUD list rows (e.g. balanced news). */
export function sourceFaviconThumbnailUrl(pageUrl: string, sizePx = 128): string {
  const size = Math.min(256, Math.max(16, Math.round(sizePx)));
  return `https://www.google.com/s2/favicons?sz=${size}&domain_url=${encodeURIComponent(pageUrl)}`;
}
