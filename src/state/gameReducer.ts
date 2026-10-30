import { scoreAnswer, METERS_PER_POINT } from '../lib/scoring';
import type { Answer, AnswerVia, Prompt } from '../lib/types';

export type RunConfig = {
  kind: 'daily' | 'challenge' | 'pack';
  dateKey: string;
  digNumber: number | null;
  packId?: string;
  packLabel?: string;
  prompts: Prompt[];
};

/**
 * intro    – prompt card visible, 3-2-1 countdown, clock not running yet (first one includes the descent)
 * prompt   – clock running, input live
 * reveal   – tier, reason, answer map; drill digs
 * results  – end of run
 */
export type RunPhase = 'intro' | 'prompt' | 'reveal' | 'results';

export type RunState = {
  run: RunConfig;
  phase: RunPhase;
  index: number;
  answers: Answer[];
  phaseStartedAt: number;
};

export type GameState = { screen: 'title' } | ({ screen: 'run' } & RunState);

export type GameAction =
  | { type: 'START_RUN'; run: RunConfig; answers?: Answer[]; now: number }
  | { type: 'BEGIN_PROMPT'; now: number }
  | { type: 'SUBMIT'; z: number | null; via: AnswerVia; now: number }
  | { type: 'NEXT'; now: number }
  | { type: 'QUIT' };

export const initialGameState: GameState = { screen: 'title' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_RUN': {
      const answers = action.answers ?? [];
      const done = answers.length >= action.run.prompts.length;
      return {
        screen: 'run',
        run: action.run,
        phase: done ? 'results' : 'intro',
        index: Math.min(answers.length, action.run.prompts.length - 1),
        answers,
        phaseStartedAt: action.now,
      };
    }
    case 'BEGIN_PROMPT':
      if (state.screen !== 'run' || state.phase !== 'intro') return state;
      return { ...state, phase: 'prompt', phaseStartedAt: action.now };
    case 'SUBMIT': {
      if (state.screen !== 'run' || state.phase !== 'prompt') return state;
      return { ...state, phase: 'reveal', phaseStartedAt: action.now, answers: [...state.answers, buildAnswer(state.run.prompts[state.index], action.z, action.via)] };
    }
    case 'NEXT': {
      if (state.screen !== 'run' || state.phase !== 'reveal') return state;
      const last = state.index >= state.run.prompts.length - 1;
      return last
        ? { ...state, phase: 'results', phaseStartedAt: action.now }
        : { ...state, phase: 'intro', index: state.index + 1, phaseStartedAt: action.now };
    }
    case 'QUIT':
      return { screen: 'title' };
  }
}

/** The single scoring path behind submitAnswer(z) — typed answers and timeouts both land here. */
export function buildAnswer(prompt: Prompt, z: number | null, via: AnswerVia): Answer {
  const { tier, points } = scoreAnswer(prompt, z);
  return { promptId: prompt.id, z, via, tier, points };
}

export const totalPoints = (answers: Answer[]) => answers.reduce((s, a) => s + a.points, 0);
export const depthFor = (answers: Answer[]) => totalPoints(answers) * METERS_PER_POINT;