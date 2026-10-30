import { addDays } from './daily';
import type { Answer } from './types';

export type Settings = {
  sound: boolean;
  /** null = follow the OS prefers-reduced-motion setting */
  reduceMotion: boolean | null;
  scanlines: boolean;
  colorblind: boolean;
  acceptNumbers: boolean;
  showTimer: boolean;
};

export type DigRecord = {
  dateKey: string;
  digNumber: number;
  answers: Answer[];
  points: number;
  completedAt: number;
};

export type InProgress = {
  dateKey: string;
  answers: Answer[];
  /** true while a prompt is on screen; a reload then counts it as a timeout */
  open: boolean;
};

export type SaveData = {
  v: 1;
  settings: Settings;
  history: Record<string, DigRecord>;
  streak: { current: number; best: number; lastDate: string | null };
  inProgress: InProgress | null;
  /** Challenge mode is saved separately and never touches the streak */
  challengeHistory: Record<string, DigRecord>;
  challengeInProgress: InProgress | null;
};

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  reduceMotion: null,
  scanlines: true,
  colorblind: false,
  acceptNumbers: false,
  showTimer: true,
};

export const STORAGE_KEY = 'obscurium:v1';

export function freshSave(): SaveData {
  return {
    v: 1,
    settings: { ...DEFAULT_SETTINGS },
    history: {},
    streak: { current: 0, best: 0, lastDate: null },
    inProgress: null,
    challengeHistory: {},
    challengeInProgress: null,
  };
}

/** In-memory fallback for when localStorage is unavailable (private mode, blocked storage). */
let memory: SaveData | null = null;

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (parsed && parsed.v === 1) {
        const base = freshSave();
        // only carry over settings that still exist (older saves may hold retired ones)
        const settings = { ...base.settings };
        for (const k of Object.keys(settings) as (keyof Settings)[]) {
          if (parsed.settings && k in parsed.settings) (settings as Record<string, unknown>)[k] = parsed.settings[k];
        }
        return {
          v: 1,
          settings,
          history: parsed.history ?? {},
          streak: { ...base.streak, ...parsed.streak },
          inProgress: parsed.inProgress ?? null,
          challengeHistory: parsed.challengeHistory ?? {},
          challengeInProgress: parsed.challengeInProgress ?? null,
        };
      }
    }
  } catch {
    // fall through to memory/defaults
  }
  return memory ?? freshSave();
}

export function writeSave(data: SaveData): void {
  memory = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or blocked — keep the in-memory copy
  }
}

export function clearSave(): void {
  memory = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Streak after completing the dig for `dateKey`. */
export function nextStreak(streak: SaveData['streak'], dateKey: string): SaveData['streak'] {
  if (streak.lastDate === dateKey) return streak;
  const current = streak.lastDate === addDays(dateKey, -1) ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastDate: dateKey };
}

/** Streak as shown today: broken if the last completed dig was before yesterday. */
export function liveStreak(streak: SaveData['streak'], todayKey: string): number {
  if (streak.lastDate === todayKey || streak.lastDate === addDays(todayKey, -1)) return streak.current;
  return 0;
}
