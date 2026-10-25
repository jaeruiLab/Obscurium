import { familiarity } from './elements';
import type { Prompt, Tier } from './types';

export const TIER_POINTS: Record<Tier, number> = {
  bedrock: 10,
  ore: 25,
  vein: 40,
  trace: 60,
  rare: 80,
  mole: 100,
  technical: 15,
};

export const TIER_LABEL: Record<Tier, string> = {
  bedrock: 'Bedrock',
  ore: 'Ore',
  vein: 'Vein',
  trace: 'Trace',
  rare: 'Rare Earth',
  mole: 'One in a Mole',
  technical: 'Technically Correct',
};

export const TIER_EMOJI: Record<Tier, string> = {
  bedrock: '🟫',
  ore: '🟧',
  vein: '🟨',
  trace: '⬜',
  rare: '🟪',
  mole: '⚛️',
  technical: '🟦',
};
export const MISS_EMOJI = '⬛';

/** Display order, most common → rarest */
export const TIER_ORDER: Tier[] = ['bedrock', 'ore', 'vein', 'trace', 'rare', 'mole', 'technical'];

/** Exponent in share(e) = f(e)^k / Σ f(v)^k */
export const FAMILIARITY_K = 2.5;

export function tierFromShare(share: number): Tier {
  if (share >= 0.25) return 'bedrock';
  if (share >= 0.12) return 'ore';
  if (share >= 0.06) return 'vein';
  if (share >= 0.02) return 'trace';
  return 'rare';
}

/** Predicted pick share for each valid element (edge elements excluded). */
export function predictedShares(prompt: Prompt): Map<number, number> {
  const weights = prompt.validZ.map((z) => [z, familiarity(z) ** FAMILIARITY_K] as const);
  const total = weights.reduce((s, [, w]) => s + w, 0);
  return new Map(weights.map(([z, w]) => [z, w / total]));
}

const tableCache = new Map<string, Map<number, Tier>>();

/** Tier for every scoring element (valid + edge) in a prompt. Memoized per prompt id. */
export function tierTable(prompt: Prompt): Map<number, Tier> {
  const cached = tableCache.get(prompt.id);
  if (cached) return cached;
  const shares = predictedShares(prompt);
  const table = new Map<number, Tier>();
  for (const z of prompt.validZ) {
    if (z === prompt.moleZ) table.set(z, 'mole');
    else if (prompt.overrides?.[z]) table.set(z, prompt.overrides[z]);
    else table.set(z, tierFromShare(shares.get(z)!));
  }
  for (const { z } of prompt.edge ?? []) table.set(z, 'technical');
  tableCache.set(prompt.id, table);
  return table;
}

export type Scored = { valid: boolean; tier: Tier | null; points: number };

export function scoreAnswer(prompt: Prompt, z: number | null): Scored {
  if (z == null) return { valid: false, tier: null, points: 0 };
  const tier = tierTable(prompt).get(z) ?? null;
  if (!tier) return { valid: false, tier: null, points: 0 };
  return { valid: true, tier, points: TIER_POINTS[tier] };
}

export const METERS_PER_POINT = 10;
