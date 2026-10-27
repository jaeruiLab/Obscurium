import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearSave, freshSave, liveStreak, loadSave, nextStreak, STORAGE_KEY, writeSave } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
  clearSave();
});

describe('storage', () => {
  it('round-trips through localStorage', () => {
    const s = freshSave();
    s.streak = { current: 3, best: 5, lastDate: '2026-10-29' };
    writeSave(s);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).streak.current).toBe(3);
    expect(loadSave().streak).toEqual({ current: 3, best: 5, lastDate: '2026-10-29' });
  });

  it('fills in settings added after the save was written', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, settings: { sound: false } }));
    const s = loadSave();
    expect(s.settings.sound).toBe(false);
    expect(s.settings.showTimer).toBe(true);
  });

  it('drops settings that no longer exist', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, settings: { hardMode: true, defaultInput: 'table', sound: false }, lastInputMode: 'table' }));
    const s = loadSave();
    expect(s.settings).not.toHaveProperty('hardMode');
    expect(s.settings).not.toHaveProperty('defaultInput');
    expect(s).not.toHaveProperty('lastInputMode');
    expect(s.settings.sound).toBe(false);
  });

  it('survives corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{nope');
    expect(loadSave()).toEqual(freshSave());
  });

  it('keeps working in memory when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const s = freshSave();
    s.streak.current = 9;
    expect(() => writeSave(s)).not.toThrow();
    expect(loadSave().streak.current).toBe(9);
  });
});

describe('streaks', () => {
  const zero = { current: 0, best: 0, lastDate: null };

  it('starts at 1, extends on consecutive days and resets after a gap', () => {
    const d1 = nextStreak(zero, '2026-10-29');
    expect(d1).toEqual({ current: 1, best: 1, lastDate: '2026-10-29' });
    const d2 = nextStreak(d1, '2026-10-30');
    expect(d2.current).toBe(2);
    const gap = nextStreak(d2, '2026-11-02');
    expect(gap).toEqual({ current: 1, best: 2, lastDate: '2026-11-02' });
  });

  it('does not double-count the same day', () => {
    const d1 = nextStreak(zero, '2026-10-29');
    expect(nextStreak(d1, '2026-10-29')).toBe(d1);
  });

  it('shows a broken streak as 0 on the title screen', () => {
    const s = { current: 4, best: 4, lastDate: '2026-10-29' };
    expect(liveStreak(s, '2026-10-29')).toBe(4);
    expect(liveStreak(s, '2026-10-30')).toBe(4);
    expect(liveStreak(s, '2026-10-31')).toBe(0);
  });
});
