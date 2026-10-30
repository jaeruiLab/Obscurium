import { describe, expect, it } from 'vitest';
import { challengeForDate, promptsForDate } from '../lib/daily';
import { freshSave, type SaveData } from '../lib/storage';
import { buildAnswer } from './gameReducer';
import { settleInProgress } from './useGame';

const today = '2026-11-03';
const prompts = promptsForDate(today);

function withProgress(answers: number, open: boolean): SaveData {
  const s = freshSave();
  s.inProgress = { dateKey: today, answers: prompts.slice(0, answers).map((p) => buildAnswer(p, p.moleZ, 'type')), open };
  return s;
}

describe('settleInProgress (anti-replay)', () => {
  it('counts a prompt that was on screen during a reload as a timeout', () => {
    const s = settleInProgress(withProgress(2, true), today);
    expect(s.inProgress!.answers).toHaveLength(3);
    expect(s.inProgress!.answers[2]).toMatchObject({ promptId: prompts[2].id, z: null, via: 'timeout', points: 0 });
    expect(s.inProgress!.open).toBe(false);
  });

  it('leaves progress alone when reloading on a reveal', () => {
    const s = settleInProgress(withProgress(2, false), today);
    expect(s.inProgress!.answers).toHaveLength(2);
  });

  it('finishes the dig when the last prompt was open', () => {
    const s = settleInProgress(withProgress(6, true), today);
    expect(s.inProgress).toBeNull();
    expect(s.history[today].answers).toHaveLength(7);
    expect(s.history[today].answers[6].via).toBe('timeout');
    expect(s.streak.current).toBe(1);
  });

  it('drops an unfinished dig from a previous day', () => {
    const s = settleInProgress(withProgress(3, true), '2026-11-04');
    expect(s.inProgress).toBeNull();
    expect(s.history).toEqual({});
  });

  it('drops progress saved against an older prompt bank', () => {
    const s = withProgress(2, true);
    s.inProgress!.answers[0] = { ...s.inProgress!.answers[0], promptId: 'retired-prompt' };
    expect(settleInProgress(s, today).inProgress).toBeNull();
  });

  it('settles Challenge separately and never touches the streak', () => {
    const ch = challengeForDate(today);
    const s = freshSave();
    s.challengeInProgress = { dateKey: today, answers: ch.slice(0, 6).map((p) => buildAnswer(p, p.moleZ, 'type')), open: true };
    const settled = settleInProgress(s, today, 'challenge');
    expect(settled.challengeHistory[today].answers).toHaveLength(7);
    expect(settled.challengeInProgress).toBeNull();
    expect(settled.history).toEqual({});
    expect(settled.streak.current).toBe(0);
  });

  it('never overwrites a completed dig', () => {
    const done = settleInProgress(withProgress(6, true), today);
    const replay = { ...done, inProgress: { dateKey: today, answers: [], open: true } };
    const s = settleInProgress(replay, today);
    expect(s.inProgress).toBeNull();
    expect(s.history[today]).toBe(done.history[today]);
  });
});
