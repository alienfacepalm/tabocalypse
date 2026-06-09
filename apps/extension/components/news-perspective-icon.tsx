import { ArrowBigLeft, ArrowBigRight, CircleDot, Newspaper } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import React from "react";
import { HudTip } from "./hud-tip";
import {
  NEWS_PERSPECTIVE_LABELS,
  newsPerspectiveTooltip,
  topicBalanceTooltip,
  topicPerspectiveIconTooltip,
} from "../lib/news/balanced-news-labels";
import type { TNewsPerspectiveAssignmentRole } from "../lib/news/news-perspective-assignment";
import type {
  INewsTopicRoundup,
  TFqnBiasLabel,
  TNewsPerspective,
} from "../lib/news/balanced-news-types";

const PERSPECTIVE_ICONS: Record<TNewsPerspective, LucideIcon> = {
  left: ArrowBigLeft,
  center: CircleDot,
  right: ArrowBigRight,
};

const PERSPECTIVE_COLOR_CLASS: Record<TNewsPerspective, string> = {
  left: "text-blue-400",
  center: "text-zinc-400",
  right: "text-red-400",
};

export const PERSPECTIVE_SLOT_ACCENT_CLASS: Record<TNewsPerspective, string> = {
  left: "border-l-2 border-l-blue-400",
  center: "",
  right: "border-r-2 border-r-red-400",
};

export function NewsPerspectiveIcon({
  perspective,
  size = 14,
  dimmed = false,
  bias,
  source,
  isOpinion,
  role,
  showTip = true,
}: {
  perspective: TNewsPerspective;
  size?: number;
  /** Muted when that perspective slot is empty in a topic summary. */
  dimmed?: boolean;
  bias?: TFqnBiasLabel;
  source?: string;
  isOpinion?: boolean;
  role?: TNewsPerspectiveAssignmentRole;
  /** When false, render only the icon (parent supplies {@link HudTip}). */
  showTip?: boolean;
}): React.JSX.Element {
  const Icon = PERSPECTIVE_ICONS[perspective];
  const tip = newsPerspectiveTooltip(perspective, { bias, source, isOpinion, role });
  const icon = (
    <Icon
      size={size}
      strokeWidth={2}
      aria-hidden
      className={["shrink-0", PERSPECTIVE_COLOR_CLASS[perspective], dimmed ? "opacity-35" : ""]
        .filter(Boolean)
        .join(" ")}
    />
  );

  if (!showTip) {
    return icon;
  }

  return (
    <HudTip tip={tip}>
      <span className="inline-flex shrink-0 align-middle" aria-label={tip}>
        {icon}
      </span>
    </HudTip>
  );
}

const PERSPECTIVE_ORDER: readonly TNewsPerspective[] = ["left", "center", "right"];

export function TopicBalanceIcons({
  topic,
}: {
  topic: Pick<INewsTopicRoundup, "kind" | "left" | "center" | "right" | "balanceScore">;
}): React.JSX.Element {
  if (topic.kind === "reporting") {
    const tip = topicBalanceTooltip(topic);
    return (
      <HudTip tip={tip} wrapClassName="shrink-0">
        <span className="inline-flex shrink-0 align-middle text-muted" aria-label={tip}>
          <Newspaper size={14} strokeWidth={2} aria-hidden />
        </span>
      </HudTip>
    );
  }

  const slotArticle: Record<TNewsPerspective, INewsTopicRoundup["left"]> = {
    left: topic.left,
    center: topic.center,
    right: topic.right,
  };

  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 align-middle"
      role="img"
      aria-label={topicBalanceTooltip(topic)}
    >
      {PERSPECTIVE_ORDER.map((perspective) => {
        const article = slotArticle[perspective];
        const tip = topicPerspectiveIconTooltip(perspective, article);
        return (
          <HudTip key={perspective} tip={tip} wrapClassName="shrink-0">
            <span className="inline-flex shrink-0 align-middle" aria-label={tip}>
              <NewsPerspectiveIcon
                perspective={perspective}
                size={12}
                dimmed={article == null}
                showTip={false}
              />
            </span>
          </HudTip>
        );
      })}
    </span>
  );
}

export function PerspectiveHeader({
  perspective,
}: {
  perspective: TNewsPerspective;
}): React.JSX.Element {
  const label = NEWS_PERSPECTIVE_LABELS[perspective];
  const tip = newsPerspectiveTooltip(perspective, { role: "column-header" });

  return (
    <HudTip tip={tip}>
      <p className="mb-1 inline-flex min-w-0 items-center gap-1 font-display text-[10px] font-bold uppercase tracking-wider text-muted">
        <NewsPerspectiveIcon perspective={perspective} size={12} showTip={false} />
        <span>{label}</span>
      </p>
    </HudTip>
  );
}
