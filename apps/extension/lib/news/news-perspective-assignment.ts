import { NEWS_BIAS_LABELS, NEWS_PERSPECTIVE_LABELS } from "./balanced-news-labels";
import type { TFqnBiasLabel, TNewsPerspective } from "./balanced-news-types";
import { mapBiasToPerspective } from "./map-bias-perspective";

export type TNewsPerspectiveAssignmentRole =
  | "column-header"
  | "article"
  | "topic-slot-filled"
  | "topic-slot-missing";

export interface INewsPerspectiveAssignmentInput {
  perspective: TNewsPerspective;
  role: TNewsPerspectiveAssignmentRole;
  bias?: TFqnBiasLabel;
  source?: string;
  isOpinion?: boolean;
}

function columnSlotBiasDescription(perspective: TNewsPerspective): string {
  switch (perspective) {
    case "left":
      return "left or left-center";
    case "center":
      return "center";
    case "right":
      return "right or right-center";
  }
}

function columnHeaderReason(perspective: TNewsPerspective): string {
  switch (perspective) {
    case "left":
      return "Left column shows opinion from outlets rated Left or Left-center on FreeQuickNews";
    case "center":
      return "Center column shows opinion from outlets rated Center on FreeQuickNews";
    case "right":
      return "Right column shows opinion from outlets rated Right or Right-center on FreeQuickNews";
  }
}

function perspectiveMappingClause(
  bias: Exclude<TFqnBiasLabel, "unknown">,
  perspective: TNewsPerspective,
): string {
  const column = NEWS_PERSPECTIVE_LABELS[perspective];
  if (bias === "left-center" && perspective === "left") {
    return "Left-center ratings are grouped into the Left column";
  }
  if (bias === "right-center" && perspective === "right") {
    return "Right-center ratings are grouped into the Right column";
  }
  if (bias === perspective) {
    return `${NEWS_BIAS_LABELS[bias]} ratings map to the ${column} column`;
  }
  return `Mapped to the ${column} column`;
}

/** Plain-language explanation of why an article or slot landed in Left, Center, or Right. */
export function newsPerspectiveAssignmentReason(input: INewsPerspectiveAssignmentInput): string {
  const { perspective, role, bias, source, isOpinion } = input;
  const column = NEWS_PERSPECTIVE_LABELS[perspective];

  if (role === "column-header") {
    return columnHeaderReason(perspective);
  }

  if (role === "topic-slot-missing") {
    return `No ${column.toLowerCase()} opinion take for this topic — no opinion article from a ${columnSlotBiasDescription(perspective)} outlet was found`;
  }

  const outlet = source?.trim() || "This outlet";
  const mappedPerspective = bias && bias !== "unknown" ? mapBiasToPerspective(bias) : null;

  if (!bias || bias === "unknown" || mappedPerspective == null) {
    if (role === "topic-slot-filled") {
      return `${outlet} has no FreeQuickNews publisher rating, so it was not placed in a perspective column`;
    }
    return "No FreeQuickNews publisher rating — Left, Center, and Right labels are not shown";
  }

  const parts: string[] = [
    `${outlet} is rated ${NEWS_BIAS_LABELS[bias]} on FreeQuickNews's publisher bias index`,
    perspectiveMappingClause(bias, perspective),
  ];

  if (isOpinion && (role === "article" || role === "topic-slot-filled")) {
    parts.push(
      "Assigned to this perspective because the headline was detected as opinion or editorial",
    );
  } else if (!isOpinion) {
    parts.push(
      "Lean label reflects the publisher rating only — this headline was treated as reporting, not opinion",
    );
  }

  return `${parts.join(". ")}.`;
}
