import { describe, expect, it } from "vitest";
import { isoDateToDayNumber } from "../local-iso-date";
import {
  buildDailyQuizOrder,
  buildDailyQuizSelection,
  selectDailyQuizQuestions,
} from "./daily-quiz-selection-logic";
import type { IDailyQuizPack, IDailyQuizQuestion, TDailyQuizCategory } from "./daily-quiz-types";

function makeQuestion(category: TDailyQuizCategory, i: number): IDailyQuizQuestion {
  return {
    id: `${category}-${String(i).padStart(3, "0")}`,
    category,
    prompt: `Prompt ${category} ${i}?`,
    choices: [
      `${category}-${i}-a`,
      `${category}-${i}-b`,
      `${category}-${i}-c`,
      `${category}-${i}-d`,
    ],
    correctIndex: (i % 4) as 0 | 1 | 2 | 3,
    explanation: i % 2 === 0 ? `Because ${i}.` : undefined,
  };
}

function makePack(categories: TDailyQuizCategory[], perCategory: number): IDailyQuizPack {
  const questions: IDailyQuizQuestion[] = [];
  for (const category of categories) {
    for (let i = 0; i < perCategory; i += 1) questions.push(makeQuestion(category, i));
  }
  return { id: "test-pack", name: "Test", version: "1", questions };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const FOUR_BY_FIFTEEN = makePack(["science", "geography", "history", "math"], 15);

describe("buildDailyQuizOrder", () => {
  it("is a permutation of the bank that depends on the pack id", () => {
    const a = buildDailyQuizOrder(FOUR_BY_FIFTEEN.questions, "p");
    const b = buildDailyQuizOrder(FOUR_BY_FIFTEEN.questions, "q");
    const ids = (list: IDailyQuizQuestion[]) => list.map((q) => q.id);
    expect(ids(a).slice().sort()).toEqual(ids([...FOUR_BY_FIFTEEN.questions]).sort());
    expect(ids(a)).not.toEqual(ids(b));
    expect(ids(a)).toEqual(ids(buildDailyQuizOrder(FOUR_BY_FIFTEEN.questions, "p")));
  });

  it("interleaves categories round-robin", () => {
    const order = buildDailyQuizOrder(FOUR_BY_FIFTEEN.questions, "p");
    expect(
      order
        .slice(0, 4)
        .map((q) => q.category)
        .sort(),
    ).toEqual(["geography", "history", "math", "science"].sort());
  });
});

describe("selectDailyQuizQuestions", () => {
  it("is deterministic for the same date", () => {
    const a = buildDailyQuizSelection(FOUR_BY_FIFTEEN, "2026-09-11");
    const b = buildDailyQuizSelection(FOUR_BY_FIFTEEN, "2026-09-11");
    expect(a).toEqual(b);
    expect(a.questions).toHaveLength(3);
  });

  it("picks different questions on different dates", () => {
    const ids = (iso: string) =>
      buildDailyQuizSelection(FOUR_BY_FIFTEEN, iso)
        .questions.map((q) => q.questionId)
        .sort()
        .join(",");
    expect(ids("2026-09-11")).not.toBe(ids("2026-09-12"));
  });

  it("never repeats a question until the whole bank has been shown, from any start day", () => {
    const days = FOUR_BY_FIFTEEN.questions.length / 3;
    for (const startIso of ["2026-01-01", "2026-01-13", "2026-02-27"]) {
      const seen = new Set<string>();
      for (let d = 0; d < days; d += 1) {
        for (const q of buildDailyQuizSelection(FOUR_BY_FIFTEEN, addDays(startIso, d)).questions) {
          seen.add(q.questionId);
        }
      }
      expect(seen.size).toBe(FOUR_BY_FIFTEEN.questions.length);
    }
  });

  it("spreads categories within a day when the bank allows it", () => {
    for (let d = 0; d < 20; d += 1) {
      const categories = buildDailyQuizSelection(
        FOUR_BY_FIFTEEN,
        addDays("2026-01-01", d),
      ).questions.map((q) => q.category);
      expect(new Set(categories).size).toBe(3);
    }
  });

  it("returns three distinct questions when the pick wraps past the end of the bank", () => {
    const ten = makePack(["science"], 10);
    let iso = "2026-01-01";
    while ((isoDateToDayNumber(iso) * 3) % 10 !== 9) iso = addDays(iso, 1);
    const ids = selectDailyQuizQuestions(ten.questions, iso, ten.id).map((q) => q.questionId);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    const bankIds = new Set(ten.questions.map((q) => q.id));
    for (const id of ids) expect(bankIds.has(id)).toBe(true);
  });

  it("handles banks smaller than the daily count", () => {
    const two = makePack(["math"], 2);
    const ids = selectDailyQuizQuestions(two.questions, "2026-05-05", two.id).map(
      (q) => q.questionId,
    );
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(selectDailyQuizQuestions([], "2026-05-05", "empty")).toEqual([]);
  });

  it("shuffles choices while keeping the correct answer text", () => {
    const byId = new Map(FOUR_BY_FIFTEEN.questions.map((q) => [q.id, q]));
    for (let d = 0; d < 10; d += 1) {
      for (const q of buildDailyQuizSelection(FOUR_BY_FIFTEEN, addDays("2026-03-01", d))
        .questions) {
        const original = byId.get(q.questionId);
        expect(original).toBeDefined();
        if (!original) continue;
        expect(q.choices[q.correctIndex]).toBe(original.choices[original.correctIndex]);
        expect(q.choices.slice().sort()).toEqual(original.choices.slice().sort());
        expect(q.explanation).toBe(original.explanation);
      }
    }
  });
});
