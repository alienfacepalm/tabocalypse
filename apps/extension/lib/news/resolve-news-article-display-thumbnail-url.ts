import { sourceFaviconThumbnailUrl } from "../favicon-url";
import type { INewsArticleRef } from "./balanced-news-types";
import { resolveKnownArticleThumbnailUrl } from "./resolve-known-article-thumbnail-url";

/** Image URL to show beside a balanced-news article row (API, heuristics, then source favicon). */
export function resolveNewsArticleDisplayThumbnailUrl(article: INewsArticleRef): string {
  if (article.imageUrl) return article.imageUrl;
  const known = resolveKnownArticleThumbnailUrl(article.url);
  if (known) return known;
  return sourceFaviconThumbnailUrl(article.url);
}
