const OPINION_CATEGORY_TOKENS = new Set([
  "opinion",
  "editorial",
  "commentary",
  "analysis",
  "column",
  "columns",
]);

const OPINION_URL_FRAGMENTS = [
  "/opinion/",
  "/opinions/",
  "/editorial/",
  "/commentary/",
  "/commentisfree/",
  "/viewpoint/",
];

const OPINION_TITLE_PREFIXES = ["opinion:", "editorial:", "commentary:", "column:", "analysis:"];

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase();
}

function categorySuggestsOpinion(category: unknown, tags: unknown): boolean {
  const parts: string[] = [];
  if (typeof category === "string") parts.push(category);
  if (Array.isArray(tags)) {
    for (const t of tags) {
      if (typeof t === "string") parts.push(t);
    }
  }
  for (const part of parts) {
    const token = normalizeForMatch(part).replace(/\s+/g, "_");
    if (OPINION_CATEGORY_TOKENS.has(token)) return true;
    if (token.includes("opinion") || token.includes("editorial")) return true;
  }
  return false;
}

function urlSuggestsOpinion(url: string): boolean {
  const lower = normalizeForMatch(url);
  return OPINION_URL_FRAGMENTS.some((frag) => lower.includes(frag));
}

function titleSuggestsOpinion(title: string): boolean {
  const lower = normalizeForMatch(title);
  return OPINION_TITLE_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/** True when metadata or conservative URL/title heuristics indicate opinion/editorial. */
export function detectOpinionArticle(input: {
  title: string;
  url: string;
  category?: unknown;
  tags?: unknown;
  contentType?: unknown;
}): boolean {
  if (
    typeof input.contentType === "string" &&
    input.contentType.trim().toLowerCase() === "opinion"
  ) {
    return true;
  }
  if (categorySuggestsOpinion(input.category, input.tags)) return true;
  if (urlSuggestsOpinion(input.url)) return true;
  if (titleSuggestsOpinion(input.title)) return true;
  return false;
}
