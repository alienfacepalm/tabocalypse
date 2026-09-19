import { awardXp, recordDailyPlay, type IXpLedger } from "../xp/xp-ledger-logic";
import { isIsoDateString } from "../local-iso-date";
import type {
  IDailyQuizAnswer,
  IDailyQuizProgress,
  IDailyQuizSelectedQuestion,
  IDailyQuizSelection,
} from "./daily-quiz-types";

export interface IDailyQuizRules {
  questionsPerDay: number;
  xpPerCorrect: number;
  perfectDayBonusXp: number;
  streakBonusXpPerDay: number;
  streakBonusCapDays: number;
}

export const DAILY_QUIZ_RULES: IDailyQuizRules = {
  questionsPerDay: 3,
  xpPerCorrect: 10,
  perfectDayBonusXp: 5,
  streakBonusXpPerDay: 2,
  streakBonusCapDays: 7,
};

export function emptyDailyQuizProgress(selection: IDailyQuizSelection): IDailyQuizProgress {
  return {
    version: 1,
    date: selection.date,
    packId: selection.packId,
    questionIds: selection.questions.map((q) => q.questionId),
    answers: [],
    earnedXp: 0,
  };
}

function coerceAnswer(raw: unknown): IDailyQuizAnswer | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.questionId !== "string" || !row.questionId) return null;
  if (typeof row.chosenIndex !== "number" || !Number.isInteger(row.chosenIndex)) return null;
  if (typeof row.correct !== "boolean") return null;
  const answeredAt =
    typeof row.answeredAt === "number" && Number.isFinite(row.answeredAt) ? row.answeredAt : 0;
  return {
    questionId: row.questionId,
    chosenIndex: row.chosenIndex,
    correct: row.correct,
    answeredAt,
  };
}

/** Malformed rows return null; answers are cleaned and deduped by question id (first wins). */
export function coerceDailyQuizProgress(raw: unknown): IDailyQuizProgress | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  if (row.version !== 1) return null;
  if (!isIsoDateString(row.date)) return null;
  if (typeof row.packId !== "string" || !row.packId) return null;
  if (!Array.isArray(row.questionIds)) return null;
  const questionIds = row.questionIds.filter((id): id is string => typeof id === "string");
  const answers: IDailyQuizAnswer[] = [];
  const seen = new Set<string>();
  if (Array.isArray(row.answers)) {
    for (const item of row.answers) {
      const answer = coerceAnswer(item);
      if (!answer || seen.has(answer.questionId)) continue;
      seen.add(answer.questionId);
      answers.push(answer);
    }
  }
  const progress: IDailyQuizProgress = {
    version: 1,
    date: row.date,
    packId: row.packId,
    questionIds,
    answers,
    earnedXp:
      typeof row.earnedXp === "number" && Number.isFinite(row.earnedXp) && row.earnedXp > 0
        ? Math.floor(row.earnedXp)
        : 0,
  };
  if (typeof row.completedAt === "number" && Number.isFinite(row.completedAt)) {
    progress.completedAt = row.completedAt;
  }
  return progress;
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/** Keeps stored progress (same reference) only when it was made for exactly today's selection. */
export function resolveProgressForToday(
  stored: IDailyQuizProgress | null,
  selection: IDailyQuizSelection,
): IDailyQuizProgress {
  if (
    stored &&
    stored.date === selection.date &&
    stored.packId === selection.packId &&
    sameIds(
      stored.questionIds,
      selection.questions.map((q) => q.questionId),
    )
  ) {
    return stored;
  }
  return emptyDailyQuizProgress(selection);
}

export function findDailyQuizAnswer(
  progress: IDailyQuizProgress,
  questionId: string,
): IDailyQuizAnswer | undefined {
  return progress.answers.find((a) => a.questionId === questionId);
}

export function isDailyQuizComplete(progress: IDailyQuizProgress): boolean {
  return (
    progress.questionIds.length > 0 &&
    progress.questionIds.every((id) => findDailyQuizAnswer(progress, id) !== undefined)
  );
}

export function scoreDailyQuiz(progress: IDailyQuizProgress): {
  correctCount: number;
  total: number;
} {
  const correctCount = progress.answers.filter((a) => a.correct).length;
  return { correctCount, total: progress.questionIds.length };
}

/** Bonus paid once when the day is completed: perfect-score bonus plus a capped streak bonus. */
export function computeDailyQuizCompletionBonusXp(
  correctCount: number,
  total: number,
  streakDaysAfter: number,
  rules: IDailyQuizRules = DAILY_QUIZ_RULES,
): number {
  const perfect = total > 0 && correctCount === total ? rules.perfectDayBonusXp : 0;
  const streak =
    streakDaysAfter >= 2
      ? Math.min(streakDaysAfter, rules.streakBonusCapDays) * rules.streakBonusXpPerDay
      : 0;
  return perfect + streak;
}

export interface IDailyQuizAnswerInput {
  progress: IDailyQuizProgress;
  ledger: IXpLedger;
  question: IDailyQuizSelectedQuestion;
  chosenIndex: number;
  todayIso: string;
  now: number;
  rules?: IDailyQuizRules;
}

export interface IDailyQuizAnswerResult {
  progress: IDailyQuizProgress;
  ledger: IXpLedger;
  /** False when nothing was written (already answered, out-of-range choice, unknown question). */
  changed: boolean;
  correct: boolean;
  awardedXp: number;
  completedDay: boolean;
  completionBonusXp: number;
}

/**
 * Pure answer transaction: records the answer once, awards XP for a correct choice, and on the
 * final answer records the daily play (streak) plus the completion bonus. Idempotent per question.
 */
export function applyDailyQuizAnswerTransaction(
  input: IDailyQuizAnswerInput,
): IDailyQuizAnswerResult {
  const rules = input.rules ?? DAILY_QUIZ_RULES;
  const unchanged: IDailyQuizAnswerResult = {
    progress: input.progress,
    ledger: input.ledger,
    changed: false,
    correct: false,
    awardedXp: 0,
    completedDay: false,
    completionBonusXp: 0,
  };
  const { question, chosenIndex } = input;
  if (!input.progress.questionIds.includes(question.questionId)) return unchanged;
  if (findDailyQuizAnswer(input.progress, question.questionId)) return unchanged;
  if (!Number.isInteger(chosenIndex) || chosenIndex < 0 || chosenIndex >= question.choices.length) {
    return unchanged;
  }

  const correct = chosenIndex === question.correctIndex;
  const answerXp = correct ? rules.xpPerCorrect : 0;
  let ledger = awardXp(input.ledger, answerXp);
  let progress: IDailyQuizProgress = {
    ...input.progress,
    answers: [
      ...input.progress.answers,
      { questionId: question.questionId, chosenIndex, correct, answeredAt: input.now },
    ],
    earnedXp: input.progress.earnedXp + answerXp,
  };

  let completionBonusXp = 0;
  const completedDay = isDailyQuizComplete(progress);
  if (completedDay) {
    ledger = recordDailyPlay(ledger, input.todayIso);
    const { correctCount, total } = scoreDailyQuiz(progress);
    completionBonusXp = computeDailyQuizCompletionBonusXp(
      correctCount,
      total,
      ledger.streakDays,
      rules,
    );
    ledger = awardXp(ledger, completionBonusXp);
    progress = {
      ...progress,
      earnedXp: progress.earnedXp + completionBonusXp,
      completedAt: input.now,
    };
  }

  return {
    progress,
    ledger,
    changed: true,
    correct,
    awardedXp: answerXp + completionBonusXp,
    completedDay,
    completionBonusXp,
  };
}
