export function faviconUrl(pageUrl: string): string {
  return `https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(pageUrl)}`;
}
