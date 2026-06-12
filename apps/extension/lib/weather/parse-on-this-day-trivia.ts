export interface IOnThisDayFact {
  year: number;
  text: string;
}

interface IWikimediaOnThisDayPayload {
  events?: Array<{ text?: string; year?: number }>;
  selected?: Array<{ text?: string; year?: number }>;
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeFact(raw: { text?: string; year?: number } | undefined): IOnThisDayFact | null {
  if (!raw || typeof raw.text !== "string") return null;
  const text = stripHtml(raw.text);
  if (!text) return null;
  const year = typeof raw.year === "number" && Number.isFinite(raw.year) ? raw.year : 0;
  return { year, text };
}

/** Pick up to `limit` readable facts from Wikimedia “on this day” JSON. */
export function pickOnThisDayFacts(
  payload: IWikimediaOnThisDayPayload,
  limit = 2,
): IOnThisDayFact[] {
  const pool = [...(payload.selected ?? []), ...(payload.events ?? [])];
  const out: IOnThisDayFact[] = [];
  const seen = new Set<string>();
  for (const raw of pool) {
    const fact = normalizeFact(raw);
    if (!fact) continue;
    const key = `${fact.year}:${fact.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (fact.text.length > 220) continue;
    out.push(fact);
    if (out.length >= limit) break;
  }
  return out;
}

export function buildWikimediaOnThisDayUrl(month: number, day: number, language = "en"): string {
  return `https://api.wikimedia.org/feed/v1/wikipedia/${language}/onthisday/all/${month}/${day}`;
}
