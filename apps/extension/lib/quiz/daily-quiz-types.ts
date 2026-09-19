export type TDailyQuizCategory =
  | "science"
  | "geography"
  | "history"
  | "language"
  | "technology"
  | "arts"
  | "nature"
  | "math";

export const DAILY_QUIZ_CATEGORIES: readonly TDailyQuizCategory[] = [
  "science",
  "geography",
  "history",
  "language",
  "technology",
  "arts",
  "nature",
  "math",
];

/** Plain-language labels for the widget (storage keeps `TDailyQuizCategory`). */
export const DAILY_QUIZ_CATEGORY_LABELS: Record<TDailyQuizCategory, string> = {
  science: "Science",
  geography: "Geography",
  history: "History",
  language: "Language",
  technology: "Technology",
  arts: "Arts",
  nature: "Nature",
  math: "Math",
};

export interface IDailyQuizQuestion {
  /** Stable and unique across the pack, e.g. `geography-012`. */
  id: string;
  category: TDailyQuizCategory;
  prompt: string;
  choices: readonly [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  /** One line shown after the reveal. */
  explanation?: string;
}

/** Bundled today; an importable quiz pack would carry the same shape. */
export interface IDailyQuizPack {
  id: string;
  name: string;
  version: string;
  questions: readonly IDailyQuizQuestion[];
}

/** A question as shown on one calendar day: choices shuffled per (date, id). */
export interface IDailyQuizSelectedQuestion {
  questionId: string;
  category: TDailyQuizCategory;
  prompt: string;
  choices: readonly string[];
  correctIndex: number;
  explanation?: string;
}

export interface IDailyQuizSelection {
  /** Local calendar date `YYYY-MM-DD`. */
  date: string;
  packId: string;
  questions: readonly IDailyQuizSelectedQuestion[];
}

export interface IDailyQuizAnswer {
  questionId: string;
  chosenIndex: number;
  correct: boolean;
  answeredAt: number;
}

/** Device-local progress for one calendar day (`tabocalypseDailyQuizProgress`). */
export interface IDailyQuizProgress {
  version: 1;
  date: string;
  packId: string;
  /** The day's selection, in order; a mismatch with today's selection resets progress. */
  questionIds: string[];
  /** One entry per answered question; a refresh cannot re-answer. */
  answers: IDailyQuizAnswer[];
  /** XP awarded today (answers plus completion bonus), for the summary line. */
  earnedXp: number;
  completedAt?: number;
}
