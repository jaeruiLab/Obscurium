import promptsData from '../data/prompts.json';
import calendarData from '../data/calendar.json';
import { cyrb53, mulberry32, pick, shuffle } from './rng';
import type { Prompt } from './types';

export const PROMPTS = promptsData as Prompt[];
const CALENDAR = calendarData as Record<string, string[]>;

export const LAUNCH_DATE = '2026-10-29';
export const TIME_ZONE = 'America/Chicago';
export const PROMPTS_PER_RUN = 7;
export const SECONDS_PER_PROMPT = 25;

const DAY_MS = 86_400_000;
const keyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD for the Chicago calendar day containing `d`. */
export function dateKeyFor(d: Date): string {
  return keyFormatter.format(d);
}

const keyToUtc = (key: string) => Date.parse(`${key}T00:00:00Z`);

export function addDays(key: string, n: number): string {
  return new Date(keyToUtc(key) + n * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((keyToUtc(b) - keyToUtc(a)) / DAY_MS);
}

/** Dig #001 is LAUNCH_DATE. */
export function digNumber(key: string): number {
  return daysBetween(LAUNCH_DATE, key) + 1;
}

export const formatDigNumber = (n: number) => `#${String(n).padStart(3, '0')}`;

/** Milliseconds until the next Chicago midnight (DST-safe: binary search for the date change). */
export function msUntilNextDig(now: Date): number {
  const today = dateKeyFor(now);
  let lo = now.getTime();
  let hi = lo + 26 * 3_600_000;
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (dateKeyFor(new Date(mid)) === today) lo = mid;
    else hi = mid;
  }
  return hi - now.getTime();
}

/** Days a prompt must rest before it can repeat; grows with the pool, capped at 60. */
export function cooldownDays(poolSize: number): number {
  return Math.max(0, Math.min(60, Math.floor(poolSize / PROMPTS_PER_RUN) - 1));
}

function sortByDifficulty(prompts: Prompt[]): Prompt[] {
  return prompts.map((p, i) => [p, i] as const).sort((a, b) => a[0].difficulty - b[0].difficulty || a[1] - b[1]).map(([p]) => p);
}

/** Seeded pick: one prompt per category where possible, then fill; avoids `recent` ids if it can. */
export function seededPick(seed: string, pool: Prompt[], recent: Set<string>, count = PROMPTS_PER_RUN): Prompt[] {
  const rng = mulberry32(cyrb53(`obscurium:${seed}`));
  const picked: Prompt[] = [];
  const available = (p: Prompt) => !picked.includes(p);
  const choose = (filter: (p: Prompt) => boolean) => {
    const fresh = pool.filter((p) => available(p) && filter(p) && !recent.has(p.id));
    const any = fresh.length ? fresh : pool.filter((p) => available(p) && filter(p));
    if (any.length) picked.push(pick(any, rng));
  };
  const categories = shuffle([...new Set(pool.map((p) => p.category))], rng);
  for (const cat of categories) {
    if (picked.length >= count) break;
    choose((p) => p.category === cat);
  }
  // Extra picks come from the category with the most fresh prompts left, so small
  // categories aren't drained before their own turn in the cooldown window.
  while (picked.length < Math.min(count, pool.length)) {
    const freshLeft = (cat: string) => pool.filter((p) => p.category === cat && available(p) && !recent.has(p.id)).length;
    const most = Math.max(...categories.map(freshLeft));
    const roomiest = categories.filter((c) => freshLeft(c) === most);
    const before = picked.length;
    if (most > 0) choose((p) => roomiest.includes(p.category));
    if (picked.length === before) choose(() => true);
  }
  return sortByDifficulty(picked);
}

const dayCaches = new WeakMap<Prompt[], string[][]>();

/** The 7 prompts for a Chicago calendar day. Deterministic for every player. */
export function promptsForDate(key: string, pool: Prompt[] = PROMPTS): Prompt[] {
  const byId = new Map(pool.map((p) => [p.id, p]));
  return dailyIds(key, pool).map((id) => byId.get(id)!);
}

function scheduledFor(key: string, pool: Prompt[]): string[] | null {
  const ids = CALENDAR[key];
  return ids?.length && ids.every((id) => pool.some((p) => p.id === id)) ? ids : null;
}

function dailyIds(key: string, pool: Prompt[]): string[] {
  const index = daysBetween(LAUNCH_DATE, key);
  if (index < 0) return scheduledFor(key, pool) ?? seededPick(key, pool, new Set()).map((p) => p.id);

  // Walk forward from launch day so every day's cooldown window is itself deterministic.
  let days = dayCaches.get(pool);
  if (!days) dayCaches.set(pool, (days = []));
  const cooldown = cooldownDays(pool.length);
  for (let d = days.length; d <= index; d++) {
    const k = addDays(LAUNCH_DATE, d);
    const recent = new Set<string>();
    for (let r = Math.max(0, d - cooldown); r < d; r++) days[r].forEach((id) => recent.add(id));
    days.push(scheduledFor(k, pool) ?? seededPick(k, pool, recent).map((p) => p.id));
  }
  return days[index];
}

/** A random 7-prompt run from a themed pack (not seeded — packs are replayable). */
export function packPrompts(packId: string, seed: string, pool: Prompt[] = PROMPTS): Prompt[] {
  return seededPick(`${packId}:${seed}`, pool.filter((p) => p.packs.includes(packId)), new Set());
}
