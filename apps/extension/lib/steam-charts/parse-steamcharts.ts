export interface ISteamChartsTopGameRow {
  rank: number;
  appId: number;
  name: string;
  currentPlayers: number | null;
  peakPlayers: number | null;
  hoursPlayed: number | null;
}

export interface ISteamChartsTopRecordRow {
  rank: number;
  appId: number;
  name: string;
  peakAllTime: number | null;
  timeIso: string | null;
}

export interface ISteamChartsAppSummary {
  appId: number;
  name: string;
  playingNow: number | null;
  peak24h: number | null;
  peakAllTime: number | null;
  updatedAtIso: string | null;
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
    const peakPlayers = nums[1] ?? null;
    const hoursPlayed = nums[2] ?? null;

    rows.push({ rank, appId, name, currentPlayers, peakPlayers, hoursPlayed });
  }

  return rows;
}

export function parseSteamChartsTopRecords(html: string): ISteamChartsTopRecordRow[] {
  const table = extractTable(html, "toppeaks");
  if (!table) return [];

  const rows: ISteamChartsTopRecordRow[] = [];
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

    const peak = parseIntLike(
      stripTags(
        (/<td[^>]*class=["'][^"']*\bnum\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/i.exec(rowHtml) ??
          [])[1] ?? "",
      ),
    );
    const timeIso =
      stripTags(
        (/<td[^>]*id=["']toppeaks_\d+_time["'][^>]*>([\s\S]*?)<\/td>/i.exec(rowHtml) ?? [])[1] ??
          "",
      ) || null;

    rows.push({ rank: rows.length + 1, appId, name, peakAllTime: peak, timeIso });
  }

  return rows;
}

export function parseSteamChartsAppSummary(
  html: string,
  appId: number,
): ISteamChartsAppSummary | null {
  if (!Number.isFinite(appId) || appId <= 0) return null;

  const title =
    /<h1[^>]*id=["']app-title["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h1>/i.exec(html);
  const name = title ? stripTags(title[1] ?? "") : "";

  const statBlockRe =
    /<div[^>]*class=["'][^"']*\bapp-stat\b[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*\bnum\b[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<br>\s*([^<\n\r]*)/gi;
  const stats = [...html.matchAll(statBlockRe)].map((m) => ({
    value: parseIntLike(stripTags(m[1] ?? "")),
    label: stripTags(m[2] ?? "").toLowerCase(),
  }));

  const playingNow = stats.find((s) => s.label.startsWith("playing"))?.value ?? null;
  const peak24h = stats.find((s) => s.label.includes("24-hour peak"))?.value ?? null;
  const peakAllTime = stats.find((s) => s.label.includes("all-time peak"))?.value ?? null;

  const updatedAtIso =
    /<abbr[^>]*class=["'][^"']*\btimeago\b[^"']*["'][^>]*title=["']([^"']+)["'][^>]*>/i.exec(
      html,
    )?.[1] ?? null;

  if (!name) return null;
  return { appId, name, playingNow, peak24h, peakAllTime, updatedAtIso };
}
