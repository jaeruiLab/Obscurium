import { useCallback, useEffect, useReducer, useRef } from 'react';
import { challengeForDate, dateKeyFor, digNumber, packPrompts, promptsForDate } from '../lib/daily';
import { nextStreak, type DigRecord, type InProgress, type SaveData } from '../lib/storage';
import { useSave } from './save';
import { buildAnswer, gameReducer, initialGameState, totalPoints, type RunConfig } from './gameReducer';
import type { AnswerVia, Prompt } from '../lib/types';

export const PACK_LABELS: Record<string, string> = {
  halloween: 'HALF-LIFE HALLOWEEN',
};

/** Runs that are saved, once per day each: the daily dig and the daily Challenge. */
export type TrackedKind = 'daily' | 'challenge';

const SLOTS = {
  daily: { history: 'history', inProgress: 'inProgress' },
  challenge: { history: 'challengeHistory', inProgress: 'challengeInProgress' },
} as const;

export const historyOf = (save: SaveData, kind: TrackedKind) => save[SLOTS[kind].history];
export const inProgressOf = (save: SaveData, kind: TrackedKind) => save[SLOTS[kind].inProgress];
const promptsFor = (kind: TrackedKind, key: string): Prompt[] => (kind === 'daily' ? promptsForDate(key) : challengeForDate(key));

function withInProgress(save: SaveData, kind: TrackedKind, ip: InProgress | null): SaveData {
  return { ...save, [SLOTS[kind].inProgress]: ip };
}

/**
 * Settle a saved in-progress dig on load: a prompt that was on screen during a reload counts
 * as a timeout (no free retries), and a dig from a previous day — or from an older prompt
 * bank — is dropped.
 */
export function settleInProgress(save: SaveData, todayKey: string, kind: TrackedKind = 'daily'): SaveData {
  const ip = inProgressOf(save, kind);
  if (!ip) return save;
  if (ip.dateKey !== todayKey || historyOf(save, kind)[ip.dateKey]) return withInProgress(save, kind, null);
  const prompts = promptsFor(kind, ip.dateKey);
  if (ip.answers.some((a, i) => a.promptId !== prompts[i]?.id)) return withInProgress(save, kind, null);
  let answers = ip.answers;
  if (ip.open && answers.length < prompts.length) {
    answers = [...answers, buildAnswer(prompts[answers.length], null, 'timeout')];
  }
  if (answers.length >= prompts.length) return finish(withInProgress(save, kind, null), kind, ip.dateKey, answers);
  return withInProgress(save, kind, { dateKey: ip.dateKey, answers, open: false });
}

function finish(save: SaveData, kind: TrackedKind, dateKey: string, answers: DigRecord['answers']): SaveData {
  const history = historyOf(save, kind);
  if (history[dateKey]) return withInProgress(save, kind, null);
  const record: DigRecord = {
    dateKey,
    digNumber: digNumber(dateKey),
    answers,
    points: totalPoints(answers),
    completedAt: Date.now(),
  };
  const next = withInProgress({ ...save, [SLOTS[kind].history]: { ...history, [dateKey]: record } }, kind, null);
  // only the daily dig builds the streak
  return kind === 'daily' ? { ...next, streak: nextStreak(save.streak, dateKey) } : next;
}

export function useGame() {
  const { save, update } = useSave();
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const todayKey = dateKeyFor(new Date());

  // Settle any interrupted digs once, on load.
  const settled = useRef(false);
  useEffect(() => {
    if (settled.current) return;
    settled.current = true;
    const key = dateKeyFor(new Date());
    update((s) => settleInProgress(settleInProgress(s, key, 'daily'), key, 'challenge'));
  }, [update]);

  // Persist daily and Challenge progress as the run advances.
  useEffect(() => {
    if (state.screen !== 'run' || state.run.kind === 'pack') return;
    const kind = state.run.kind;
    const { dateKey } = state.run;
    if (state.phase === 'results') {
      update((s) => finish(s, kind, dateKey, state.answers));
    } else {
      const open = state.phase === 'intro' || state.phase === 'prompt';
      update((s) => {
        if (historyOf(s, kind)[dateKey]) return s;
        const ip = inProgressOf(s, kind);
        if (ip && ip.dateKey === dateKey && ip.open === open && ip.answers.length === state.answers.length) return s;
        return withInProgress(s, kind, { dateKey, answers: state.answers, open });
      });
    }
  }, [state, update]);

  const start = useCallback(
    (kind: TrackedKind) => {
      const key = dateKeyFor(new Date());
      if (historyOf(save, kind)[key]) return;
      const run: RunConfig = { kind, dateKey: key, digNumber: digNumber(key), prompts: promptsFor(kind, key) };
      const ip = inProgressOf(save, kind);
      dispatch({ type: 'START_RUN', run, answers: ip?.dateKey === key ? ip.answers : [], now: Date.now() });
    },
    [save],
  );
  const startDaily = useCallback(() => start('daily'), [start]);
  const startChallenge = useCallback(() => start('challenge'), [start]);

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
    const key = dateKeyFor(new Date());
    update((s) => settleInProgress(settleInProgress(s, key, 'daily'), key, 'challenge'));
  }, [update]);

  return { state, todayKey, startDaily, startChallenge, startPack, submit, beginPrompt, next, quit };
}
