import type { INewsArticleRef, INewsTopicRoundup } from "./balanced-news-types";
import { normalizeNewsTopicRoundup } from "./normalize-balanced-news-snapshot";

function newestArticle(articles: readonly INewsArticleRef[]): INewsArticleRef | null {
  if (articles.length === 0) return null;
  return [...articles].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))[0] ?? null;
}

/** Primary article shown in the topic list thumbnail and selected preview panel. */
export function resolveTopicPreviewArticle(topic: INewsTopicRoundup): INewsArticleRef | null {
  const normalized = normalizeNewsTopicRoundup(topic);
  if (normalized.kind === "reporting" && normalized.reporting) {
    return normalized.reporting;
  }

  const slotted = [normalized.left, normalized.center, normalized.right].filter(
    (article): article is INewsArticleRef => article != null,
  );
  const fromSlots = newestArticle(slotted);
  if (fromSlots) return fromSlots;

  return normalized.articles[0] ?? null;
}
