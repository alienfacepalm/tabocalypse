export type TBookmarkSearchItem = {
  id: string;
  title?: string;
  url?: string;
};

function isAlphanumeric(ch: string): boolean {
  return /[a-z0-9]/i.test(ch);
}

/** True when match edges sit on a non-alphanumeric boundary (or string edge). */
function isWordAligned(text: string, start: number, end: number): boolean {
  const before = start === 0 || !isAlphanumeric(text[start - 1] ?? "");
  const after = end >= text.length || !isAlphanumeric(text[end] ?? "");
  return before && after;
}

function scoreTextMatch(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q || !t) return 0;

  let score = 0;

  const phraseIdx = t.indexOf(q);
  if (phraseIdx >= 0) {
    score += 10_000;
    score += Math.max(0, 500 - phraseIdx);
    if (isWordAligned(t, phraseIdx, phraseIdx + q.length)) {
      score += 2_000;
    }
    return score;
  }

  const qCompact = q.replace(/[-\s]+/g, "");
  const tCompact = t.replace(/[-\s]+/g, "");
  if (qCompact.length >= 3) {
    const compactIdx = tCompact.indexOf(qCompact);
    if (compactIdx >= 0) {
      score += 5_000;
      score += Math.max(0, 300 - compactIdx);
      return score;
    }
  }

  const tokens = q.split(/[^a-z0-9]+/).filter((tok) => tok.length > 0);
  if (tokens.length > 1) {
    const substantive = tokens.filter((tok) => tok.length >= 2);
    if (substantive.length > 0 && substantive.every((tok) => t.includes(tok))) {
      score += 800;
      for (const tok of substantive) {
        const idx = t.indexOf(tok);
        score += tok.length * 80;
        if (idx >= 0 && isWordAligned(t, idx, idx + tok.length)) {
          score += 120;
        }
      }
      return score;
    }
  }

  return score;
}

export function bookmarkSearchRelevanceScore(item: TBookmarkSearchItem, query: string): number {
  const q = query.trim();
  if (!q) return 0;

  const title = item.title ?? "";
  const url = item.url ?? "";
  return scoreTextMatch(title, q) * 3 + scoreTextMatch(url, q);
}

/** Re-rank browser bookmark search hits so exact title/URL matches surface first. */
export function rankBookmarksBySearchRelevance<T extends TBookmarkSearchItem>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim();
  if (!q || items.length < 2) return items;

  const scored = items.map((item, index) => ({
    item,
    index,
    score: bookmarkSearchRelevanceScore(item, q),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const titleA = (a.item.title ?? a.item.url ?? "").length;
    const titleB = (b.item.title ?? b.item.url ?? "").length;
    if (titleA !== titleB) return titleA - titleB;
    return a.index - b.index;
  });

  return scored.map((s) => s.item);
}
