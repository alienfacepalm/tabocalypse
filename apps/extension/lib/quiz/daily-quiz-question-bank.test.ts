import { describe, expect, it } from "vitest";
import { BUILTIN_DAILY_QUIZ_PACK } from "./daily-quiz-question-bank";
import { DAILY_QUIZ_CATEGORIES } from "./daily-quiz-types";

const MIN_QUESTIONS = 90;
const MIN_CATEGORIES_WITH_DEPTH = 3;
const MIN_PER_DEEP_CATEGORY = 15;
const MAX_PROMPT_CHARS = 200;
const MAX_CHOICE_CHARS = 80;
const MAX_EXPLANATION_CHARS = 200;

describe("BUILTIN_DAILY_QUIZ_PACK", () => {
  const { questions } = BUILTIN_DAILY_QUIZ_PACK;

  it("has pack metadata", () => {
    expect(BUILTIN_DAILY_QUIZ_PACK.id).toMatch(/^[a-z0-9-]+$/);
    expect(BUILTIN_DAILY_QUIZ_PACK.name.length).toBeGreaterThan(0);
    expect(BUILTIN_DAILY_QUIZ_PACK.version.length).toBeGreaterThan(0);
  });

  it(`has at least ${MIN_QUESTIONS} questions so a month never repeats`, () => {
    expect(questions.length).toBeGreaterThanOrEqual(MIN_QUESTIONS);
  });

  it("uses unique, well-formed ids and known categories", () => {
    const ids = new Set<string>();
    for (const q of questions) {
      expect(q.id).toMatch(/^[a-z]+-\d{3}$/);
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(DAILY_QUIZ_CATEGORIES).toContain(q.category);
      expect(q.id.startsWith(`${q.category}-`)).toBe(true);
    }
  });

  it("keeps prompts, choices, and explanations within limits", () => {
    for (const q of questions) {
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.prompt.length).toBeLessThanOrEqual(MAX_PROMPT_CHARS);
      expect(q.choices).toHaveLength(4);
      const normalized = q.choices.map((c) => c.trim().toLowerCase());
      for (const c of normalized) expect(c.length).toBeGreaterThan(0);
      for (const c of q.choices) expect(c.length).toBeLessThanOrEqual(MAX_CHOICE_CHARS);
      expect(new Set(normalized).size).toBe(4);
      expect([0, 1, 2, 3]).toContain(q.correctIndex);
      if (q.explanation !== undefined) {
        expect(q.explanation.trim().length).toBeGreaterThan(0);
        expect(q.explanation.length).toBeLessThanOrEqual(MAX_EXPLANATION_CHARS);
      }
    }
  });

  it("spreads the correct answer across positions", () => {
    const counts = [0, 0, 0, 0];
    for (const q of questions) counts[q.correctIndex] = (counts[q.correctIndex] ?? 0) + 1;
    for (const count of counts) expect(count).toBeGreaterThan(questions.length / 10);
  });

  it(`has at least ${MIN_CATEGORIES_WITH_DEPTH} categories with ${MIN_PER_DEEP_CATEGORY}+ questions`, () => {
    const perCategory = new Map<string, number>();
    for (const q of questions) perCategory.set(q.category, (perCategory.get(q.category) ?? 0) + 1);
    const deep = [...perCategory.values()].filter((n) => n >= MIN_PER_DEEP_CATEGORY);
    expect(deep.length).toBeGreaterThanOrEqual(MIN_CATEGORIES_WITH_DEPTH);
  });
});
