import { passesBuiltinHardFilter } from "./filter";

export const UNSUCK_CLASSICS_SOURCE_URL = "https://www.unsuck-it.com/classics" as const;

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&ndash;/gi, "\u2013")
    .replace(/&mdash;/gi, "\u2014")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_: string, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_: string, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    );
}

function stripHtml(s: string): string {
  return decodeHtmlEntities(s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "));
}

function normalizeDefinitionText(s: string): string {
  return s
    .replace(/^Item\s+de\s*/i, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+,/g, ",")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalizeTerm(term: string): string {
  const t = term.trim();
  if (t.length <= 6 && /^[A-Z0-9.]+$/.test(t)) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

interface IScrapedEntry {
  term: string;
  text: string;
}

function parseEntries(html: string): IScrapedEntry[] {
  const out: IScrapedEntry[] = [];
  const liRe = /<li class="accordion-item">([\s\S]*?)<\/li>/g;
  let m;
  while ((m = liRe.exec(html))) {
    const block = m[1];
    const titleM = block.match(/class="accordion-item__title"[^>]*>\s*([^<]+?)\s*</);
    if (!titleM) continue;
    const term = titleM[1].trim();
    const descM = block.match(/accordion-item__description[\s\S]*?>([\s\S]*?)<\/div>/);
    if (!descM) continue;
    const text = normalizeDefinitionText(stripHtml(descM[1]));
    if (!text) continue;
    out.push({ term, text });
  }
  return out;
}

function toLine(term: string, def: string): string {
  return `${capitalizeTerm(term)} — ${def}`;
}

/** Parses Unsuck It classics HTML into humor lines (filtered). */
export function parseUnsuckClassicsHtml(html: string): string[] {
  const entries = parseEntries(html);
  if (entries.length < 10) {
    throw new Error(
      `Expected many glossary entries; got ${entries.length}. Page structure may have changed.`,
    );
  }
  const lines = entries.map((e) => toLine(e.term, e.text));
  for (const line of lines) {
    if (!passesBuiltinHardFilter(line)) {
      throw new Error(`Line blocked by built-in safety filter: ${line.slice(0, 120)}…`);
    }
  }
  return lines;
}
