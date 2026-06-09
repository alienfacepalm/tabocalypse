import type { TBalancedNewsCategory } from "./balanced-news-types";
import type { TBalancedNewsCountry } from "./balanced-news-country";

const FQN_ARTICLES_BASE = "https://freequicknews.com/api/v1/articles";

export interface IBuildFqnArticlesUrlInput {
  country: TBalancedNewsCountry;
  category: TBalancedNewsCategory;
  limit: number;
  page?: number;
}

export function buildFqnArticlesUrl(input: IBuildFqnArticlesUrlInput): string {
  const params = new URLSearchParams();
  params.set("country", input.country);
  params.set("category", input.category);
  params.set("limit", String(Math.min(50, Math.max(10, input.limit * 4))));
  if (input.page != null && input.page > 1) {
    params.set("page", String(input.page));
  }
  return `${FQN_ARTICLES_BASE}?${params.toString()}`;
}

export function buildFqnFetchHeaders(
  apiKey: string | undefined,
): Record<string, string> | undefined {
  const trimmed = apiKey?.trim();
  if (!trimmed) return undefined;
  return { "X-API-Key": trimmed };
}
