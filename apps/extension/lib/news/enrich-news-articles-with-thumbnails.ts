import type { INewsArticleRef } from "./balanced-news-types";
import { resolveKnownArticleThumbnailUrl } from "./resolve-known-article-thumbnail-url";

/** Applies API and URL-heuristic thumbnails before clustering/caching. */
export function enrichNewsArticlesWithKnownThumbnails(
  articles: readonly INewsArticleRef[],
): INewsArticleRef[] {
  return articles.map((article) => {
    if (article.imageUrl) return article;
    const known = resolveKnownArticleThumbnailUrl(article.url);
    if (!known) return article;
    return { ...article, imageUrl: known };
  });
}
