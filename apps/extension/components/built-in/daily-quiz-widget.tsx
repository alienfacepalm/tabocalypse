import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isoDateLocal, msUntilNextLocalMidnight } from "../../lib/local-iso-date";
import {
  DAILY_QUIZ_RULES,
  findDailyQuizAnswer,
  isDailyQuizComplete,
  scoreDailyQuiz,
} from "../../lib/quiz/daily-quiz-logic";
import { BUILTIN_DAILY_QUIZ_PACK } from "../../lib/quiz/daily-quiz-question-bank";
import { buildDailyQuizSelection } from "../../lib/quiz/daily-quiz-selection-logic";
import {
  answerDailyQuizQuestion,
  loadDailyQuizState,
  subscribeDailyQuizState,
  type IDailyQuizState,
} from "../../lib/quiz/daily-quiz-store";
import { DAILY_QUIZ_CATEGORY_LABELS } from "../../lib/quiz/daily-quiz-types";
import { PanelBody, PanelTip, PanelTitleInline } from "../panel-sdk";

function firstUnansweredIndex(state: IDailyQuizState, questionCount: number): number {
  for (let i = 0; i < state.progress.questionIds.length; i += 1) {
    const id = state.progress.questionIds[i];
    if (id !== undefined && !findDailyQuizAnswer(state.progress, id)) return i;
  }
  return questionCount;
}

export function DailyQuizWidget({
  onOpenRewardsSettings,
}: {
  onOpenRewardsSettings: () => void;
}): React.JSX.Element {
  const [todayIso, setTodayIso] = useState(() => isoDateLocal());
  const selection = useMemo(
    () => buildDailyQuizSelection(BUILTIN_DAILY_QUIZ_PACK, todayIso),
    [todayIso],
  );
  const [state, setState] = useState<IDailyQuizState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const initialisedForDateRef = useRef<string | null>(null);

  // Roll to a fresh set at local midnight, and re-check when the tab comes back into view.
  useEffect(() => {
    const check = (): void => {
      const next = isoDateLocal();
      setTodayIso((prev) => (prev === next ? prev : next));
    };
    const timer = window.setTimeout(check, msUntilNextLocalMidnight());
    const onVisibility = (): void => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", check);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", check);
    };
  }, [todayIso]);

  const reload = useCallback(async (): Promise<void> => {
    const next = await loadDailyQuizState(selection);
    setState(next);
  }, [selection]);

  useEffect(() => {
    let cancelled = false;
    void loadDailyQuizState(selection).then((loaded) => {
      if (cancelled) return;
      setState(loaded);
      if (initialisedForDateRef.current !== selection.date) {
        initialisedForDateRef.current = selection.date;
        setActiveIndex(firstUnansweredIndex(loaded, selection.questions.length));
      }
    });
    const unsubscribe = subscribeDailyQuizState(() => void reload());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [selection, reload]);

  const choose = async (chosenIndex: number): Promise<void> => {
    const question = selection.questions[activeIndex];
    if (busy || !state || !question) return;
    setBusy(true);
    try {
      const result = await answerDailyQuizQuestion({ selection, question, chosenIndex });
      setState({ progress: result.progress, ledger: result.ledger });
    } finally {
      setBusy(false);
    }
  };

  const total = selection.questions.length;
  const ledger = state?.ledger;
  const streakDays = ledger?.streakDays ?? 0;
  const balanceXp = ledger?.balanceXp ?? 0;
  const complete = state ? isDailyQuizComplete(state.progress) : false;
  const showSummary = state != null && complete && activeIndex >= total;
  const question = selection.questions[activeIndex];
  const answer =
    state && question ? findDailyQuizAnswer(state.progress, question.questionId) : undefined;

  return (
    <section className="card quiz-card">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <PanelTitleInline>Daily quiz</PanelTitleInline>
        <PanelTip tip="Local quiz streak and XP. Stored on this device only; no account, nothing is sent anywhere.">
          <p className="hud-xp-chip" aria-label={`Quiz streak ${streakDays} days, ${balanceXp} XP`}>
            <span className="hud-xp-chip-streak">{streakDays}d streak</span>
            <span className="hud-xp-chip-points">{balanceXp} XP</span>
          </p>
        </PanelTip>
      </div>
      <PanelBody>
        {!state ? (
          <p className="muted sm m-0">Loading today&apos;s questions…</p>
        ) : total === 0 ? (
          <p className="muted sm m-0">No questions available today.</p>
        ) : showSummary ? (
          <DailyQuizSummary
            correctCount={scoreDailyQuiz(state.progress).correctCount}
            total={total}
            earnedXp={state.progress.earnedXp}
            streakDays={streakDays}
            onOpenRewardsSettings={onOpenRewardsSettings}
          />
        ) : question ? (
          <>
            <p className="quiz-meta muted sm">
              Question {activeIndex + 1} of {total} ·{" "}
              {DAILY_QUIZ_CATEGORY_LABELS[question.category]}
            </p>
            <p className="quiz-prompt">{question.prompt}</p>
            <ol className="quiz-choices" aria-label="Answer choices">
              {question.choices.map((choice, idx) => {
                const isCorrect = idx === question.correctIndex;
                const isChosen = answer?.chosenIndex === idx;
                const className = [
                  "btn quiz-choice",
                  answer && isCorrect ? "correct" : "",
                  answer && isChosen && !isCorrect ? "wrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      className={className}
                      disabled={busy || answer !== undefined}
                      aria-pressed={isChosen}
                      onClick={() => void choose(idx)}
                    >
                      {choice}
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="quiz-feedback" aria-live="polite">
              {answer ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="m-0">
                      {answer.correct
                        ? `Correct! +${DAILY_QUIZ_RULES.xpPerCorrect} XP`
                        : `Not quite. The answer is "${question.choices[question.correctIndex] ?? ""}".`}
                    </p>
                    <button
                      type="button"
                      className="btn sm shrink-0"
                      onClick={() => setActiveIndex((i) => i + 1)}
                    >
                      {activeIndex + 1 >= total ? "See results" : "Next question"}
                    </button>
                  </div>
                  {question.explanation ? (
                    <p className="muted sm mb-0 mt-1">{question.explanation}</p>
                  ) : null}
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </PanelBody>
    </section>
  );
}

function DailyQuizSummary({
  correctCount,
  total,
  earnedXp,
  streakDays,
  onOpenRewardsSettings,
}: {
  correctCount: number;
  total: number;
  earnedXp: number;
  streakDays: number;
  onOpenRewardsSettings: () => void;
}): React.JSX.Element {
  return (
    <div className="quiz-summary">
      <p className="quiz-summary-score">
        {correctCount}/{total} correct · +{earnedXp} XP today
      </p>
      <p className="muted sm m-0">
        {streakDays}-day streak. Finish all {total} each day to keep it. New questions after
        midnight.
      </p>
      <button type="button" className="linkish self-start text-xs" onClick={onOpenRewardsSettings}>
        Spend XP on rewards
      </button>
    </div>
  );
}
