import { useCallback, useEffect, useReducer, useRef } from 'react';
import { dateKeyFor, digNumber, packPrompts, promptsForDate } from '../lib/daily';
import { nextStreak, type DigRecord, type SaveData } from '../lib/storage';
import { useSave } from './save';
import { buildAnswer, gameReducer, initialGameState, totalPoints, type RunConfig } from './gameReducer';
import type { AnswerVia } from '../lib/types';

export const PACK_LABELS: Record<string, string> = {
  halloween: 'HALF-LIFE HALLOWEEN',
};

/**
 * Settle a saved in-progress daily dig on load: a prompt that was on screen during a reload
 * counts as a timeout (no free retries), and a dig from a previous day is dropped.
 */
export function settleInProgress(save: SaveData, todayKey: string): SaveData {
  const ip = save.inProgress;
  if (!ip) return save;
  if (ip.dateKey !== todayKey || save.history[ip.dateKey]) return { ...save, inProgress: null };
  let answers = ip.answers;
  const prompts = promptsForDate(ip.dateKey);
  if (ip.open && answers.length < prompts.length) {
    answers = [...answers, buildAnswer(prompts[answers.length], null, 'timeout')];
  }
  if (answers.length >= prompts.length) return finishDaily({ ...save, inProgress: null }, ip.dateKey, answers);
  return { ...save, inProgress: { dateKey: ip.dateKey, answers, open: false } };
}

function finishDaily(save: SaveData, dateKey: string, answers: DigRecord['answers']): SaveData {
  if (save.history[dateKey]) return { ...save, inProgress: null };
  const record: DigRecord = {
    dateKey,
    digNumber: digNumber(dateKey),
    answers,
    points: totalPoints(answers),
    completedAt: Date.now(),
  };
  return {
    ...save,
    history: { ...save.history, [dateKey]: record },
    streak: nextStreak(save.streak, dateKey),
    inProgress: null,
  };
}

export function useGame() {
  const { save, update } = useSave();
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const todayKey = dateKeyFor(new Date());

  // Settle any interrupted dig once, on load.
  const settled = useRef(false);
  useEffect(() => {
    if (settled.current) return;
    settled.current = true;
    update((s) => settleInProgress(s, dateKeyFor(new Date())));
  }, [update]);

  // Persist daily progress as the run advances.
  useEffect(() => {
    if (state.screen !== 'run' || state.run.kind !== 'daily') return;
    const { dateKey } = state.run;
    if (state.phase === 'results') {
      update((s) => finishDaily(s, dateKey, state.answers));
    } else {
      const open = state.phase === 'intro' || state.phase === 'prompt';
      update((s) => {
        if (s.history[dateKey]) return s;
        const ip = s.inProgress;
        if (ip && ip.dateKey === dateKey && ip.open === open && ip.answers.length === state.answers.length) return s;
        return { ...s, inProgress: { dateKey, answers: state.answers, open } };
      });
    }
  }, [state, update]);

  const startDaily = useCallback(() => {
    const key = dateKeyFor(new Date());
    if (save.history[key]) return;
    const run: RunConfig = { kind: 'daily', dateKey: key, digNumber: digNumber(key), prompts: promptsForDate(key) };
    const resume = save.inProgress?.dateKey === key ? save.inProgress.answers : [];
    dispatch({ type: 'START_RUN', run, answers: resume, now: Date.now() });
  }, [save.history, save.inProgress]);

  const startPack = useCallback((packId: string) => {
    const key = dateKeyFor(new Date());
    const run: RunConfig = {
      kind: 'pack',
      dateKey: key,
      digNumber: null,
      packId,
      packLabel: PACK_LABELS[packId] ?? packId.toUpperCase(),
      prompts: packPrompts(packId, `${key}:${Date.now()}`),
    };
    dispatch({ type: 'START_RUN', run, now: Date.now() });
  }, []);

  const submit = useCallback((z: number | null, via: AnswerVia) => dispatch({ type: 'SUBMIT', z, via, now: Date.now() }), []);
  const beginPrompt = useCallback(() => dispatch({ type: 'BEGIN_PROMPT', now: Date.now() }), []);
  const next = useCallback(() => dispatch({ type: 'NEXT', now: Date.now() }), []);
  const quit = useCallback(() => {
    dispatch({ type: 'QUIT' });
    // Leaving mid-prompt is treated like a reload: the open prompt becomes a timeout.
    update((s) => settleInProgress(s, dateKeyFor(new Date())));
  }, [update]);

  return { state, todayKey, startDaily, startPack, submit, beginPrompt, next, quit };
}
