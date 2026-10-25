import { describe, expect, it } from 'vitest';
import { predictedShares, scoreAnswer, tierFromShare, tierTable, TIER_POINTS } from './scoring';
import type { Prompt } from './types';

const base: Prompt = {
  id: 'test-liquid',
  category: 'PHYSICAL',
  difficulty: 2,
  text: 'liquid near room temp',
  validZ: [31, 35, 37, 55, 80], // Ga Br Rb Cs Hg
  edge: [{ z: 87, note: 'never seen in bulk' }],
  moleZ: 37,
  moleFact: '',
  packs: [],
};

describe('tierFromShare', () => {
  it('maps share thresholds to tiers', () => {
    expect(tierFromShare(0.5)).toBe('bedrock');
    expect(tierFromShare(0.25)).toBe('bedrock');
    expect(tierFromShare(0.2)).toBe('ore');
    expect(tierFromShare(0.12)).toBe('ore');
    expect(tierFromShare(0.08)).toBe('vein');
    expect(tierFromShare(0.03)).toBe('trace');
    expect(tierFromShare(0.01)).toBe('rare');
  });
});

describe('scoring', () => {
  it('predicted shares sum to 1', () => {
    const total = [...predictedShares(base).values()].reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('gives the familiar answer Bedrock and the Mole answer 100', () => {
    expect(scoreAnswer(base, 80)).toEqual({ valid: true, tier: 'bedrock', points: 10 });
    expect(scoreAnswer(base, 37)).toEqual({ valid: true, tier: 'mole', points: 100 });
  });

  it('gives edge elements Technically Correct (15)', () => {
    expect(scoreAnswer(base, 87)).toEqual({ valid: true, tier: 'technical', points: TIER_POINTS.technical });
  });

  it('gives invalid answers and timeouts 0', () => {
    expect(scoreAnswer(base, 26)).toEqual({ valid: false, tier: null, points: 0 });
    expect(scoreAnswer(base, null)).toEqual({ valid: false, tier: null, points: 0 });
  });

  it('lets overrides beat the formula', () => {
    const p = { ...base, id: 'test-override', overrides: { 80: 'rare' as const } };
    expect(tierTable(p).get(80)).toBe('rare');
  });

  it('Mole wins over an override for the same element', () => {
    const p = { ...base, id: 'test-mole-override', overrides: { 37: 'bedrock' as const } };
    expect(tierTable(p).get(37)).toBe('mole');
  });
});
