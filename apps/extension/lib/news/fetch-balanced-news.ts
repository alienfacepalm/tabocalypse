import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import { buildFqnArticlesUrl, buildFqnFetchHeaders } from "./balanced-news-fqn-url";
import type { TBalancedNewsCategory } from "./balanced-news-types";
import type { TBalancedNewsCountry } from "./balanced-news-country";
import { filterArticlesForBalancedNewsCategory } from "./balanced-news-category-filter";
import { detectOpinionArticle } from "./detect-opinion-article";
import { coerceFqnBiasLabel, mapBiasToPerspective } from "./map-bias-perspective";
import type { INewsArticleRef, TFqnBiasLabel } from "./balanced-news-types";

export { buildFqnArticlesUrl, buildFqnFetchHeaders } from "./balanced-news-fqn-url";

export interface IFetchBalancedNewsInput {
  country: TBalancedNewsCountry;
  category: TBalancedNewsCategory;
  limit: number;
  apiKey?: string;
}

const MAX_FETCH_PAGES = 4;

function parsePublishedAt(raw: unknown): number | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

function pickString(row: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

function normalizeFqnCategory(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeArticleRow(raw: unknown): INewsArticleRef | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const title = pickString(row, ["title", "headline", "name"]);
  const url = pickString(row, ["url", "link", "articleUrl"]);
  const source = pickString(row, ["source", "sourceName", "publisher", "outlet"]);
  if (!title || !url) return null;

  const bias: TFqnBiasLabel = coerceFqnBiasLabel(row.bias ?? row.biasRating ?? row.politicalBias);
  const category = row.category ?? row.section;
  const tags = row.tags;
  const contentType = row.contentType;

  return {
    title,
    url,
    source: source || "Unknown source",
    bias,
    perspective: mapBiasToPerspective(bias),
    publishedAt: parsePublishedAt(row.date ?? row.publishedAt ?? row.published_at),
    isOpinion: detectOpinionArticle({ title, url, category, tags, contentType }),
    fqnCategory: normalizeFqnCategory(category),
  };
}

function extractArticleRows(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") return [];
  const row = payload as Record<string, unknown>;
  if (Array.isArray(row.articles)) return row.articles;
  if (Array.isArray(row.results)) return row.results;
  if (Array.isArray(row.data)) return row.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

async function fetchArticlePage(
  input: IFetchBalancedNewsInput,
  page: number,
  signal?: AbortSignal,
): Promise<INewsArticleRef[]> {
  const url = buildFqnArticlesUrl({ ...input, page });
  const headers = buildFqnFetchHeaders(input.apiKey);
  const payload = await privilegedExtensionFetchJson(url, signal, headers);
  const rows = extractArticleRows(payload);
  const out: INewsArticleRef[] = [];
  for (const raw of rows) {
    const article = normalizeArticleRow(raw);
    if (article) out.push(article);
  }
  return out;
}

export async function fetchBalancedNewsArticles(
  input: IFetchBalancedNewsInput,
  signal?: AbortSignal,
): Promise<INewsArticleRef[]> {
  const targetCount = Math.min(50, Math.max(10, input.limit * 4));
  const collected: INewsArticleRef[] = [];
  const seenUrls = new Set<string>();

  for (let page = 1; page <= MAX_FETCH_PAGES; page += 1) {
    const pageArticles = await fetchArticlePage(input, page, signal);
    if (pageArticles.length === 0) break;

    for (const article of pageArticles) {
      if (seenUrls.has(article.url)) continue;
      seenUrls.add(article.url);
      collected.push(article);
    }

    const filtered = filterArticlesForBalancedNewsCategory(collected, input.category, targetCount);
    if (filtered.length >= targetCount) {
      return filtered.slice(0, targetCount);
    }
  }

  return filterArticlesForBalancedNewsCategory(collected, input.category, 1).slice(0, targetCount);
}
