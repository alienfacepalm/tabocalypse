/** Political perspective bucket for balanced news roundups. */
export type TNewsPerspective = "left" | "center" | "right";

/** Raw bias label from FreeQuickNews (five-point scale). */
export type TFqnBiasLabel =
  | "left"
  | "left-center"
  | "center"
  | "right-center"
  | "right"
  | "unknown";

export interface INewsArticleRef {
  title: string;
  url: string;
  source: string;
  bias: TFqnBiasLabel;
  perspective: TNewsPerspective | null;
  publishedAt: number | null;
  isOpinion: boolean;
  /** FreeQuickNews category slug when present (e.g. tech, politics). */
  fqnCategory: string | null;
  /** Article hero/thumbnail URL when FreeQuickNews provides one. */
  imageUrl: string | null;
  /** Short summary or lede when FreeQuickNews provides one. */
  description: string | null;
}

export type TNewsTopicKind = "opinion" | "reporting";

export interface INewsTopicRoundup {
  id: string;
  title: string;
  kind: TNewsTopicKind;
  publishedAt: number | null;
  /** All articles grouped into this topic (newest first). */
  articles: readonly INewsArticleRef[];
  /** Opinion topics: up to one article per perspective. */
  left: INewsArticleRef | null;
  center: INewsArticleRef | null;
  right: INewsArticleRef | null;
  /** Reporting topics: primary article. */
  reporting: INewsArticleRef | null;
  balanceScore: number;
}

export interface INewsFeedSnapshot {
  topics: INewsTopicRoundup[];
  fetchedAt: number;
  country: string;
  category: string;
  stale: boolean;
}

export type TBalancedNewsCategory = "politics" | "world" | "tech" | "business" | "health" | "ai";
