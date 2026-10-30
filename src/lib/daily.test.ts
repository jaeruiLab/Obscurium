import { describe, expect, it } from 'vitest';
import {
  addDays,
  challengeForDate,
  CHALLENGE_PROMPTS,
  cooldownDays,
  DAILY_PROMPTS,
  dateKeyFor,
  digNumber,
  LAUNCH_DATE,
  msUntilNextDig,
  packPrompts,
  promptsForDate,
} from './daily';

describe('Chicago day boundary', () => {
  it('rolls over at midnight America/Chicago, not UTC', () => {
    // 2026-10-29 23:59 CDT = 2026-10-30 04:59 UTC
    expect(dateKeyFor(new Date('2026-10-30T04:59:00Z'))).toBe('2026-10-29');
    expect(dateKeyFor(new Date('2026-10-30T05:00:00Z'))).toBe('2026-10-30');
  });

  it('handles standard time (CST, UTC−6)', () => {
    expect(dateKeyFor(new Date('2026-12-02T05:59:00Z'))).toBe('2026-12-01');
    expect(dateKeyFor(new Date('2026-12-02T06:00:00Z'))).toBe('2026-12-02');
  });

  it('counts down to the next Chicago midnight, including across a DST change', () => {
    expect(msUntilNextDig(new Date('2026-10-30T04:00:00Z'))).toBeCloseTo(3_600_000, -4);
    // DST ends 2026-11-01 02:00 CDT; that Chicago day is 25 hours long
    expect(msUntilNextDig(new Date('2026-11-01T05:00:00Z'))).toBeCloseTo(25 * 3_600_000, -4);
  });
});

describe('dig numbers', () => {
  it('launch day is dig #1', () => {
    expect(digNumber(LAUNCH_DATE)).toBe(1);
    expect(digNumber(addDays(LAUNCH_DATE, 1))).toBe(2);
    expect(digNumber('2027-10-29')).toBe(366);
  });

  it('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('daily prompt selection', () => {
  it('returns the same 7 prompts for the same date', () => {
    const a = promptsForDate('2026-11-05').map((p) => p.id);
    const b = promptsForDate('2026-11-05').map((p) => p.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(7);
    expect(new Set(a).size).toBe(7);
  });

  it('gives different days different prompts', () => {
    expect(promptsForDate('2026-11-05').map((p) => p.id)).not.toEqual(promptsForDate('2026-11-06').map((p) => p.id));
  });

  it('only uses the broad daily prompts', () => {
    for (let d = 0; d < 30; d++) {
      for (const p of promptsForDate(addDays(LAUNCH_DATE, d))) expect(p.mode).toBe('daily');
    }
  });

  it('covers every category each day', () => {
    const categories = new Set(DAILY_PROMPTS.map((p) => p.category));
    for (let d = 0; d < 30; d++) {
      const day = promptsForDate(addDays(LAUNCH_DATE, d));
      expect(new Set(day.map((p) => p.category))).toEqual(categories);
    }
  });

  it('ramps difficulty from easy to hard', () => {
    for (let d = 0; d < 30; d++) {
      const diffs = promptsForDate(addDays(LAUNCH_DATE, d)).map((p) => p.difficulty);
      expect(diffs).toEqual([...diffs].sort((a, b) => a - b));
    }
  });

  it.each([
    ['daily', DAILY_PROMPTS, promptsForDate],
    ['challenge', CHALLENGE_PROMPTS, challengeForDate],
  ] as const)('does not repeat a %s prompt inside the cooldown window', (_, pool, forDate) => {
    const cooldown = cooldownDays(pool);
    expect(cooldown).toBeGreaterThan(0);
    for (let d = cooldown; d < 120; d++) {
      const today = new Set(forDate(addDays(LAUNCH_DATE, d)).map((p) => p.id));
      for (let r = d - cooldown; r < d; r++) {
        for (const p of forDate(addDays(LAUNCH_DATE, r))) expect(today.has(p.id)).toBe(false);
      }
    }
  });

  it('sizes the cooldown by the pool and its smallest category, capped at 60 days', () => {
    const big = Array.from({ length: 1000 }, (_, i) => ({ ...DAILY_PROMPTS[0], id: String(i), category: i % 2 ? 'TRENDS' : 'SYMBOLS' }) as const);
    expect(cooldownDays(big)).toBe(60);
    const lopsided = big.slice(0, 40).map((p, i) => ({ ...p, category: i < 3 ? 'TRENDS' : 'SYMBOLS' }) as const);
    expect(cooldownDays(lopsided)).toBe(2);
  });
});

describe('Challenge mode', () => {
  it('gives everyone the same 7 niche prompts each day', () => {
    const a = challengeForDate('2026-11-05').map((p) => p.id);
    expect(a).toEqual(challengeForDate('2026-11-05').map((p) => p.id));
    expect(a).toHaveLength(7);
    for (const id of a) expect(CHALLENGE_PROMPTS.some((p) => p.id === id)).toBe(true);
  });

  it('never overlaps the daily dig', () => {
    for (let d = 0; d < 30; d++) {
      const key = addDays(LAUNCH_DATE, d);
      const daily = new Set(promptsForDate(key).map((p) => p.id));
      for (const p of challengeForDate(key)) expect(daily.has(p.id)).toBe(false);
    }
  });
});

describe('themed packs', () => {
  it('draws 7 prompts from the Half-Life Halloween pack', () => {
    const run = packPrompts('halloween', 'seed-1');
    expect(run).toHaveLength(7);
    for (const p of run) expect(p.packs).toContain('halloween');
  });
});
