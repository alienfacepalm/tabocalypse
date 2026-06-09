import type {
  TFqnBiasLabel,
  TBalancedNewsCategory,
  INewsTopicRoundup,
  TNewsPerspective,
  TNewsTopicKind,
} from "./balanced-news-types";
import {
  newsPerspectiveAssignmentReason,
  type INewsPerspectiveAssignmentInput,
} from "./news-perspective-assignment";

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

export const NEWS_BIAS_LABELS: Record<Exclude<TFqnBiasLabel, "unknown">, string> = {
  left: "Left",
  "left-center": "Left-center",
  center: "Center",
  "right-center": "Right-center",
  right: "Right",
};

const PERSPECTIVE_ORDER: readonly TNewsPerspective[] = ["left", "center", "right"];

export function newsPerspectiveTooltip(
  perspective: INewsPerspectiveAssignmentInput["perspective"],
  options?: Partial<
    Pick<INewsPerspectiveAssignmentInput, "bias" | "source" | "isOpinion" | "role">
  >,
): string {
  return newsPerspectiveAssignmentReason({
    perspective,
    role: options?.role ?? (options?.source ? "article" : "column-header"),
    bias: options?.bias,
    source: options?.source,
    isOpinion: options?.isOpinion,
  });
}

export function topicBalanceTooltip(
  topic: Pick<INewsTopicRoundup, "kind" | "left" | "center" | "right" | "balanceScore">,
): string {
  if (topic.kind === "reporting") {
    return "Reporting topic — grouped by headline similarity without Left/Center/Right opinion columns";
  }

  const available = PERSPECTIVE_ORDER.filter((perspective) => {
    if (perspective === "left") return topic.left != null;
    if (perspective === "center") return topic.center != null;
    return topic.right != null;
  }).map((perspective) => NEWS_PERSPECTIVE_LABELS[perspective].toLowerCase());

  const basis =
    "Perspective slots use each outlet's FreeQuickNews publisher rating (left, left-center, center, right-center, or right)";

  if (topic.balanceScore >= 3) {
    return `${basis}. Left, center, and right opinion takes are available for this topic`;
  }
  if (topic.balanceScore === 2 && available.length === 2) {
    return `${basis}. Only ${available.join(" and ")} opinion takes were found (partial coverage)`;
  }
  return `${basis}. Limited opinion coverage for this topic`;
}

export function topicPerspectiveIconTooltip(
  perspective: INewsPerspectiveAssignmentInput["perspective"],
  article: INewsTopicRoundup["left"],
): string {
  if (!article) {
    return newsPerspectiveAssignmentReason({
      perspective,
      role: "topic-slot-missing",
    });
  }

  return newsPerspectiveAssignmentReason({
    perspective,
    role: "topic-slot-filled",
    bias: article.bias,
    source: article.source,
    isOpinion: article.isOpinion,
  });
}

export function topicBalanceBadge(kind: TNewsTopicKind, balanceScore: number): string {
  if (kind === "reporting") return "Reporting";
  if (balanceScore >= 3) return "L·C·R";
  if (balanceScore === 2) return "Partial";
  return "Opinion";
}
