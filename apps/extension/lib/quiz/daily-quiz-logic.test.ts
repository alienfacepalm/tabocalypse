import { describe, expect, it } from "vitest";
import { emptyXpLedger, type IXpLedger } from "../xp/xp-ledger-logic";
import {
  applyDailyQuizAnswerTransaction,
  coerceDailyQuizProgress,
  computeDailyQuizCompletionBonusXp,
  emptyDailyQuizProgress,
  isDailyQuizComplete,
  resolveProgressForToday,
  scoreDailyQuiz,
} from "./daily-quiz-logic";
import type {
  IDailyQuizProgress,
  IDailyQuizSelectedQuestion,
  IDailyQuizSelection,
} from "./daily-quiz-types";

function question(id: string, correctIndex: number): IDailyQuizSelectedQuestion {
  return {
    questionId: id,
    category: "science",
    prompt: `Prompt ${id}?`,
    choices: ["a", "b", "c", "d"],
    correctIndex,
  };
}

const Q1 = question("q1", 0);
const Q2 = question("q2", 1);
const Q3 = question("q3", 2);
const TODAY = "2026-09-11";
const SELECTION: IDailyQuizSelection = { date: TODAY, packId: "pack", questions: [Q1, Q2, Q3] };

function ledgerWith(over: Partial<IXpLedger>): IXpLedger {
  return { ...emptyXpLedger(), ...over };
}

function answer(
  progress: IDailyQuizProgress,
  ledger: IXpLedger,
  q: IDailyQuizSelectedQuestion,
  chosenIndex: number,
) {
  return applyDailyQuizAnswerTransaction({
    progress,
    ledger,
    question: q,
    chosenIndex,
    todayIso: TODAY,
    now: 1_000,
  });
}

describe("applyDailyQuizAnswerTransaction", () => {
  it("awards XP for a correct answer and records a wrong one for free", () => {
    const start = emptyDailyQuizProgress(SELECTION);
    const right = answer(start, emptyXpLedger(), Q1, 0);
    expect(right.changed).toBe(true);
    expect(right.correct).toBe(true);
    expect(right.awardedXp).toBe(10);
    expect(right.ledger).toMatchObject({ balanceXp: 10, lifetimeXp: 10 });
    expect(right.progress.earnedXp).toBe(10);

    const wrong = answer(right.progress, right.ledger, Q2, 3);
    expect(wrong.correct).toBe(false);
    expect(wrong.awardedXp).toBe(0);
    expect(wrong.ledger).toBe(right.ledger);
    expect(wrong.progress.answers).toHaveLength(2);
  });

  it("refuses to re-answer and returns the same references", () => {
    const first = answer(emptyDailyQuizProgress(SELECTION), emptyXpLedger(), Q1, 0);
    const again = answer(first.progress, first.ledger, Q1, 1);
    expect(again.changed).toBe(false);
    expect(again.progress).toBe(first.progress);
    expect(again.ledger).toBe(first.ledger);
  });

  it("ignores out-of-range choices and unknown questions", () => {
    const start = emptyDailyQuizProgress(SELECTION);
    const ledger = emptyXpLedger();
    expect(answer(start, ledger, Q1, -1).changed).toBe(false);
    expect(answer(start, ledger, Q1, 4).changed).toBe(false);
    expect(answer(start, ledger, question("zz", 0), 0).changed).toBe(false);
  });

  it("completes the day with a perfect bonus and starts a streak", () => {
    let progress = emptyDailyQuizProgress(SELECTION);
    let ledger = emptyXpLedger();
    for (const [q, idx] of [
      [Q1, 0],
      [Q2, 1],
    ] as const) {
      const r = answer(progress, ledger, q, idx);
      progress = r.progress;
      ledger = r.ledger;
      expect(r.completedDay).toBe(false);
    }
    const last = answer(progress, ledger, Q3, 2);
    expect(last.completedDay).toBe(true);
    expect(last.completionBonusXp).toBe(5);
    expect(last.awardedXp).toBe(15);
    expect(last.ledger).toMatchObject({
      balanceXp: 35,
      lifetimeXp: 35,
      streakDays: 1,
      lastPlayedDate: TODAY,
    });
    expect(last.progress.completedAt).toBe(1_000);
    expect(last.progress.earnedXp).toBe(35);
    expect(isDailyQuizComplete(last.progress)).toBe(true);
    expect(scoreDailyQuiz(last.progress)).toEqual({ correctCount: 3, total: 3 });
  });

  it("pays the streak bonus on a consecutive day and skips the perfect bonus for 2/3", () => {
    let progress = emptyDailyQuizProgress(SELECTION);
    let ledger = ledgerWith({ streakDays: 1, lastPlayedDate: "2026-09-10" });
    ledger = answer(progress, ledger, Q1, 0).ledger;
    progress = answer(progress, ledger, Q1, 0).progress;
    const second = answer(progress, ledger, Q2, 3);
    const last = answer(second.progress, second.ledger, Q3, 2);
    expect(last.completedDay).toBe(true);
    expect(last.ledger.streakDays).toBe(2);
    expect(last.completionBonusXp).toBe(4);
    expect(last.ledger.balanceXp).toBe(24);
  });

  it("resets the streak after a gap", () => {
    let progress = emptyDailyQuizProgress(SELECTION);
    let ledger = ledgerWith({ streakDays: 6, lastPlayedDate: "2026-09-01" });
    for (const [q, idx] of [
      [Q1, 0],
      [Q2, 1],
      [Q3, 2],
    ] as const) {
      const r = answer(progress, ledger, q, idx);
      progress = r.progress;
      ledger = r.ledger;
    }
    expect(ledger.streakDays).toBe(1);
  });
});

describe("computeDailyQuizCompletionBonusXp", () => {
  it("caps the streak bonus", () => {
    expect(computeDailyQuizCompletionBonusXp(3, 3, 1)).toBe(5);
    expect(computeDailyQuizCompletionBonusXp(2, 3, 2)).toBe(4);
    expect(computeDailyQuizCompletionBonusXp(3, 3, 30)).toBe(5 + 7 * 2);
  });
});

describe("resolveProgressForToday", () => {
  it("keeps matching progress by reference and resets on any mismatch", () => {
    const stored = emptyDailyQuizProgress(SELECTION);
    expect(resolveProgressForToday(stored, SELECTION)).toBe(stored);
    expect(resolveProgressForToday(null, SELECTION)).toEqual(stored);
    expect(resolveProgressForToday({ ...stored, date: "2026-09-10" }, SELECTION)).not.toBe(stored);
    expect(resolveProgressForToday({ ...stored, packId: "other" }, SELECTION)).not.toBe(stored);
    expect(
      resolveProgressForToday({ ...stored, questionIds: ["q1", "q2", "zz"] }, SELECTION),
    ).not.toBe(stored);
  });
});

describe("coerceDailyQuizProgress", () => {
  it("rejects malformed rows", () => {
    expect(coerceDailyQuizProgress(null)).toBeNull();
    expect(coerceDailyQuizProgress("row")).toBeNull();
    expect(
      coerceDailyQuizProgress({ version: 2, date: TODAY, packId: "p", questionIds: [] }),
    ).toBeNull();
    expect(
      coerceDailyQuizProgress({ version: 1, date: "today", packId: "p", questionIds: [] }),
    ).toBeNull();
  });

  it("cleans and dedupes answers", () => {
    const cleaned = coerceDailyQuizProgress({
      version: 1,
      date: TODAY,
      packId: "p",
      questionIds: ["q1", 5, "q2"],
      answers: [
        { questionId: "q1", chosenIndex: 0, correct: true, answeredAt: 5 },
        { questionId: "q1", chosenIndex: 1, correct: false, answeredAt: 6 },
        { questionId: "q2", chosenIndex: 1.5, correct: true },
        "garbage",
      ],
      earnedXp: -4,
      completedAt: "soon",
    });
    expect(cleaned).toEqual({
      version: 1,
      date: TODAY,
      packId: "p",
      questionIds: ["q1", "q2"],
      answers: [{ questionId: "q1", chosenIndex: 0, correct: true, answeredAt: 5 }],
      earnedXp: 0,
    });
  });
});
