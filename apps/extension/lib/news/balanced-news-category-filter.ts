import type { INewsArticleRef, TBalancedNewsCategory } from "./balanced-news-types";

/** FQN category slugs that satisfy each Tabocalypse category (strict match). */
const FQN_CATEGORY_ALIASES: Record<TBalancedNewsCategory, readonly string[]> = {
  politics: ["politics"],
  world: ["world"],
  tech: ["tech", "github", "security"],
  business: ["business"],
  health: ["health"],
  ai: ["ai"],
};

const AI_TAG_PATTERN = /\b(ai|llm|gpt|anthropic|openai|gemini|machine learning|neural)\b/i;

const TITLE_HINTS: Record<TBalancedNewsCategory, RegExp | null> = {
  politics:
    /\b(politics|political|election|senate|congress|parliament|white house|president|governor|minister|democrat|republican)\b/i,
  world:
    /\b(world|global|international|diplomat|embassy|nato|united nations|foreign policy|conflict|invasion)\b/i,
  business:
    /\b(business|economy|economic|market|stocks|earnings|ipo|merger|acquisition|fed |inflation|gdp)\b/i,
  health: /\b(health|medical|hospital|vaccine|disease|fda|cdc|clinical|patient)\b/i,
  tech: null,
  ai: AI_TAG_PATTERN,
};

function normalizeFqnCategory(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function tagsText(article: INewsArticleRef): string {
  return article.title;
}

function strictCategoryMatch(article: INewsArticleRef, category: TBalancedNewsCategory): boolean {
  const fqn = normalizeFqnCategory(article.fqnCategory);
  if (!fqn) return false;
  const aliases = FQN_CATEGORY_ALIASES[category];
  if (aliases.includes(fqn)) {
    if (category === "tech") {
      return !AI_TAG_PATTERN.test(tagsText(article));
    }
    return true;
  }
  if (category === "ai" && fqn === "tech" && AI_TAG_PATTERN.test(tagsText(article))) {
    return true;
  }
  return false;
}

function relaxedCategoryMatch(article: INewsArticleRef, category: TBalancedNewsCategory): boolean {
  if (strictCategoryMatch(article, category)) return true;
  const hint = TITLE_HINTS[category];
  if (!hint) return false;
  return hint.test(article.title);
}

/** True when an article belongs in the requested balanced-news category. */
export function articleMatchesBalancedNewsCategory(
  article: INewsArticleRef,
  category: TBalancedNewsCategory,
  relaxed = false,
): boolean {
  if (relaxed) return relaxedCategoryMatch(article, category);
  return strictCategoryMatch(article, category);
}

/** Keep newest-first articles that match the category; dedupes by URL. */
export function filterArticlesForBalancedNewsCategory(
  articles: readonly INewsArticleRef[],
  category: TBalancedNewsCategory,
  minCount: number,
): INewsArticleRef[] {
  const seen = new Set<string>();
  const strict: INewsArticleRef[] = [];
  const relaxed: INewsArticleRef[] = [];

  for (const article of articles) {
    if (seen.has(article.url)) continue;
    if (articleMatchesBalancedNewsCategory(article, category, false)) {
      seen.add(article.url);
      strict.push(article);
    }
  }

  if (strict.length >= minCount) return strict;

  for (const article of articles) {
    if (seen.has(article.url)) continue;
    if (articleMatchesBalancedNewsCategory(article, category, true)) {
      seen.add(article.url);
      relaxed.push(article);
    }
  }

  return [...strict, ...relaxed];
}
