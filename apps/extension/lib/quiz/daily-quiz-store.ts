import browser from "webextension-polyfill";
import { coerceXpLedger, type IXpLedger } from "../xp/xp-ledger-logic";
import { XP_LEDGER_STORAGE_KEY } from "../xp/xp-ledger-store";
import {
  applyDailyQuizAnswerTransaction,
  coerceDailyQuizProgress,
  resolveProgressForToday,
  type IDailyQuizAnswerResult,
} from "./daily-quiz-logic";
import type {
  IDailyQuizProgress,
  IDailyQuizSelectedQuestion,
  IDailyQuizSelection,
} from "./daily-quiz-types";

/** Standalone `storage.local` key for today's answers (device-only, overwritten each day). */
export const DAILY_QUIZ_PROGRESS_STORAGE_KEY = "tabocalypseDailyQuizProgress";

type TStorageChangeListener = Parameters<typeof browser.storage.onChanged.addListener>[0];

export interface IDailyQuizState {
  progress: IDailyQuizProgress;
  ledger: IXpLedger;
}

async function readStored(): Promise<{ progress: IDailyQuizProgress | null; ledger: IXpLedger }> {
  const raw = await browser.storage.local.get([
    DAILY_QUIZ_PROGRESS_STORAGE_KEY,
    XP_LEDGER_STORAGE_KEY,
  ]);
  return {
    progress: coerceDailyQuizProgress(raw[DAILY_QUIZ_PROGRESS_STORAGE_KEY]),
    ledger: coerceXpLedger(raw[XP_LEDGER_STORAGE_KEY]),
  };
}

/** Progress resolved against today's selection (a stale or mismatched row yields a fresh day). */
export async function loadDailyQuizState(selection: IDailyQuizSelection): Promise<IDailyQuizState> {
  const { progress, ledger } = await readStored();
  return { progress: resolveProgressForToday(progress, selection), ledger };
}

/**
 * Records one answer. Reads both keys fresh right before applying and writes them in a single
 * `set` so an answer and its XP can never be persisted separately.
 */
export async function answerDailyQuizQuestion(input: {
  selection: IDailyQuizSelection;
  question: IDailyQuizSelectedQuestion;
  chosenIndex: number;
  now?: number;
}): Promise<IDailyQuizAnswerResult> {
  const { progress, ledger } = await loadDailyQuizState(input.selection);
  const result = applyDailyQuizAnswerTransaction({
    progress,
    ledger,
    question: input.question,
    chosenIndex: input.chosenIndex,
    todayIso: input.selection.date,
    now: input.now ?? Date.now(),
  });
  if (result.changed) {
    await browser.storage.local.set({
      [DAILY_QUIZ_PROGRESS_STORAGE_KEY]: result.progress,
      [XP_LEDGER_STORAGE_KEY]: result.ledger,
    });
  }
  return result;
}

/** Fires when another new-tab instance writes progress or the ledger. */
export function subscribeDailyQuizState(onChange: () => void): () => void {
  const listener: TStorageChangeListener = (changes, areaName) => {
    if (areaName !== "local") return;
    if (!(DAILY_QUIZ_PROGRESS_STORAGE_KEY in changes) && !(XP_LEDGER_STORAGE_KEY in changes))
      return;
    onChange();
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
