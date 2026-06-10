import { detectOpinionArticle } from "./detect-opinion-article";
import { coerceFqnBiasLabel, mapBiasToPerspective } from "./map-bias-perspective";
import type { INewsArticleRef, TFqnBiasLabel } from "./balanced-news-types";

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

function pickDescription(row: Record<string, unknown>): string | null {
  const value = pickString(row, [
    "description",
    "summary",
    "excerpt",
    "snippet",
    "dek",
    "subtitle",
    "content",
  ]);
  return value.length > 0 ? value : null;
}

function pickArticleImageUrl(row: Record<string, unknown>): string | null {
  for (const key of ["imageUrl", "image", "thumbnail", "thumbnailUrl"]) {
    const value = row[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
      return trimmed;
    }
  }
  return null;
}

export function normalizeFqnArticleRow(raw: unknown): INewsArticleRef | null {
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
    imageUrl: pickArticleImageUrl(row),
    description: pickDescription(row),
  };
}
