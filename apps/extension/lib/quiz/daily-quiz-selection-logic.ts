import { isoDateToDayNumber } from "../local-iso-date";
import { seededShuffle } from "./daily-quiz-seed";
import type {
  IDailyQuizPack,
  IDailyQuizQuestion,
  IDailyQuizSelectedQuestion,
  IDailyQuizSelection,
  TDailyQuizCategory,
} from "./daily-quiz-types";

export const DAILY_QUIZ_QUESTIONS_PER_DAY = 3;

/**
 * One fixed walking order per pack: every category bucket is shuffled with a pack-specific seed,
 * then buckets are interleaved round-robin so consecutive picks mostly differ in category.
 * A single fixed order is what makes "no repeats until the whole bank has been shown" hold for
 * any window of consecutive days, including across the wrap.
 */
export function buildDailyQuizOrder(
  questions: readonly IDailyQuizQuestion[],
  packId: string,
): IDailyQuizQuestion[] {
  const buckets = new Map<TDailyQuizCategory, IDailyQuizQuestion[]>();
  for (const question of questions) {
    const bucket = buckets.get(question.category);
    if (bucket) bucket.push(question);
    else buckets.set(question.category, [question]);
  }
  const categories = [...buckets.keys()].sort();
  const shuffled = categories.map((category) =>
    seededShuffle(buckets.get(category) ?? [], `${packId}|order|${category}`),
  );
  const out: IDailyQuizQuestion[] = [];
  let remaining = true;
  for (let i = 0; remaining; i += 1) {
    remaining = false;
    for (const bucket of shuffled) {
      const question = bucket[i];
      if (question) {
        out.push(question);
        remaining = true;
      }
    }
  }
  return out;
}

function shuffleChoices(question: IDailyQuizQuestion, seed: string): IDailyQuizSelectedQuestion {
  const order = seededShuffle([0, 1, 2, 3], seed);
  const choices = order.map((i) => question.choices[i] ?? "");
  const selected: IDailyQuizSelectedQuestion = {
    questionId: question.id,
    category: question.category,
    prompt: question.prompt,
    choices,
    correctIndex: order.indexOf(question.correctIndex),
  };
  if (question.explanation) selected.explanation = question.explanation;
  return selected;
}

/**
 * Deterministic pick for one calendar day: `count` consecutive entries of the pack order starting
 * at `dayNumber * count` (wrapping), with the day's choices shuffled per (date, question).
 */
export function selectDailyQuizQuestions(
  questions: readonly IDailyQuizQuestion[],
  isoDate: string,
  packId: string,
  count = DAILY_QUIZ_QUESTIONS_PER_DAY,
): IDailyQuizSelectedQuestion[] {
  const n = questions.length;
  if (n === 0 || count <= 0) return [];
  const take = Math.min(count, n);
  const order = buildDailyQuizOrder(questions, packId);
  const offset = isoDateToDayNumber(isoDate) * count;
  const start = ((offset % n) + n) % n;
  const picked: IDailyQuizQuestion[] = [];
  for (let i = 0; i < take; i += 1) {
    const question = order[(start + i) % n];
    if (question) picked.push(question);
  }
  return picked.map((question) => shuffleChoices(question, `${isoDate}|${question.id}`));
}

export function buildDailyQuizSelection(
  pack: IDailyQuizPack,
  isoDate: string,
  count = DAILY_QUIZ_QUESTIONS_PER_DAY,
): IDailyQuizSelection {
  return {
    date: isoDate,
    packId: pack.id,
    questions: selectDailyQuizQuestions(pack.questions, isoDate, pack.id, count),
  };
}
