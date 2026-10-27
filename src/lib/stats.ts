import { METERS_PER_POINT, TIER_ORDER } from './scoring';
import type { DigRecord } from './storage';
import type { Tier } from './types';

export type Stats = {
  played: number;
  avgDepth: number;
  bestDepth: number;
  bestDig: number | null;
  tiers: Record<Tier | 'miss', number>;
};

export function computeStats(history: Record<string, DigRecord>): Stats {
  const records = Object.values(history);
  const tiers = Object.fromEntries([...TIER_ORDER, 'miss'].map((t) => [t, 0])) as Stats['tiers'];
  let best: DigRecord | null = null;
  for (const r of records) {
    for (const a of r.answers) tiers[a.tier ?? 'miss']++;
    if (!best || r.points > best.points) best = r;
  }
  const total = records.reduce((s, r) => s + r.points, 0);
  return {
    played: records.length,
    avgDepth: records.length ? Math.round((total / records.length) * METERS_PER_POINT) : 0,
    bestDepth: best ? best.points * METERS_PER_POINT : 0,
    bestDig: best?.digNumber ?? null,
    tiers,
  };
}
