import type { TBalancedNewsCategory } from "./balanced-news-types";
import type { TNewsPerspective, TNewsTopicKind } from "./balanced-news-types";

export const BALANCED_NEWS_CATEGORY_LABELS: Record<TBalancedNewsCategory, string> = {
  politics: "Politics",
  world: "World",
  tech: "Tech",
  business: "Business",
  health: "Health",
  ai: "AI",
};

export const NEWS_PERSPECTIVE_LABELS: Record<TNewsPerspective, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

export function topicBalanceBadge(kind: TNewsTopicKind, balanceScore: number): string {
  if (kind === "reporting") return "Reporting";
  if (balanceScore >= 3) return "L·C·R";
  if (balanceScore === 2) return "Partial";
  return "Opinion";
}
