export interface ISteamChartsTopGameRow {
  rank: number;
  appId: number;
  name: string;
  currentPlayers: number | null;
}

function parseIntLike(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

function stripTags(raw: string): string {
  return decodeHtmlEntities(raw.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTable(html: string, tableId: string): string | null {
  const re = new RegExp(`<table[^>]*id=["']${tableId}["'][^>]*>([\\s\\S]*?)</table>`, "i");
  const m = re.exec(html);
  return m?.[1] ?? null;
}

export function parseSteamChartsTopGames(html: string): ISteamChartsTopGameRow[] {
  const table = extractTable(html, "top-games");
  if (!table) return [];

  const rows: ISteamChartsTopGameRow[] = [];
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(table))) {
    const rowHtml = rowMatch[1] ?? "";

    const link = /<a[^>]*href=["']\/app\/(\d+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(rowHtml);
    if (!link) continue;
    const appId = parseIntLike(link[1] ?? "") ?? 0;
    if (appId <= 0) continue;
    const name = stripTags(link[2] ?? "");
    if (!name) continue;

    const rankText = stripTags((/<td[^>]*>\s*(\d+)\.\s*<\/td>/i.exec(rowHtml) ?? [])[1] ?? "");
    const rank = parseIntLike(rankText) ?? rows.length + 1;

    const nums = [
      ...rowHtml.matchAll(/<td[^>]*class=["'][^"']*\bnum\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/gi),
    ]
      .map((m) => parseIntLike(stripTags(m[1] ?? "")))
      .filter((n): n is number => n != null);

    const currentPlayers = nums[0] ?? null;

    rows.push({ rank, appId, name, currentPlayers });
  }

  return rows;
}
