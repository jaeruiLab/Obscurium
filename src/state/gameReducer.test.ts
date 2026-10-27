import { describe, expect, it } from 'vitest';
import { promptsForDate } from '../lib/daily';
import { gameReducer, initialGameState, type GameState, type RunConfig } from './gameReducer';

const run: RunConfig = { kind: 'daily', dateKey: '2026-10-29', digNumber: 1, prompts: promptsForDate('2026-10-29') };

function started(): GameState {
  let s = gameReducer(initialGameState, { type: 'START_RUN', run, now: 0 });
  s = gameReducer(s, { type: 'BEGIN_PROMPT', now: 3000 });
  return s;
}

describe('gameReducer', () => {
  it('walks intro → prompt → reveal → … → results', () => {
    let s = gameReducer(initialGameState, { type: 'START_RUN', run, now: 0 });
    expect(s.screen === 'run' && s.phase).toBe('intro');
    for (let i = 0; i < 7; i++) {
      s = gameReducer(s, { type: 'BEGIN_PROMPT', now: 1 });
      expect(s.screen === 'run' && s.phase).toBe('prompt');
      s = gameReducer(s, { type: 'SUBMIT', z: null, via: 'timeout', now: 2 });
      expect(s.screen === 'run' && s.phase).toBe('reveal');
      s = gameReducer(s, { type: 'NEXT', now: 3 });
    }
    expect(s.screen === 'run' && s.phase).toBe('results');
    expect(s.screen === 'run' && s.answers).toHaveLength(7);
  });

  it('ignores a second submit for the same prompt', () => {
    let s = started();
    s = gameReducer(s, { type: 'SUBMIT', z: 1, via: 'type', now: 1 });
    const again = gameReducer(s, { type: 'SUBMIT', z: 2, via: 'type', now: 2 });
    expect(again).toBe(s);
  });

  it('scores a typed answer through the shared scoring path', () => {
    const prompt = run.prompts[0];
    const s = gameReducer(started(), { type: 'SUBMIT', z: prompt.moleZ, via: 'type', now: 5 });
    if (s.screen !== 'run') throw new Error('expected run');
    expect(s.answers[0]).toEqual({ promptId: prompt.id, z: prompt.moleZ, via: 'type', tier: 'mole', points: 100 });
  });

  it('resumes mid-run from saved answers', () => {
    const answers = [{ promptId: run.prompts[0].id, z: null, via: 'timeout' as const, tier: null, points: 0 }];
    const s = gameReducer(initialGameState, { type: 'START_RUN', run, answers, now: 0 });
    expect(s.screen === 'run' && s.index).toBe(1);
  });
});
