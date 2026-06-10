import type { INewsArticleRef } from "./balanced-news-types";

const DEFAULT_MAX_LENGTH = 240;

function firstParagraph(text: string): string {
  const paragraph = text.split(/\n\n|\r\n\r\n/)[0]?.trim();
  return paragraph && paragraph.length > 0 ? paragraph : text.trim();
}

function truncateWithEllipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/** One-line preview blurb for the selected article panel (description or source fallback). */
export function formatArticleSynopsis(
  article: INewsArticleRef,
  maxLength: number = DEFAULT_MAX_LENGTH,
): string {
  const raw = article.description?.trim();
  if (raw) {
    return truncateWithEllipsis(firstParagraph(raw), maxLength);
  }
  return truncateWithEllipsis(
    `Latest from ${article.source}. Open the article to read more.`,
    maxLength,
  );
}
