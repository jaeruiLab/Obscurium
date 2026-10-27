import { describe, expect, it } from 'vitest';
import { shareText } from './share';
import { ELEMENTS } from './elements';
import type { Answer } from './types';

const answers: Answer[] = [
  { promptId: 'a', z: 80, via: 'type', tier: 'bedrock', points: 10 },
  { promptId: 'b', z: 29, via: 'type', tier: 'ore', points: 25 },
  { promptId: 'c', z: 47, via: 'type', tier: 'vein', points: 40 },
  { promptId: 'd', z: 50, via: 'type', tier: 'trace', points: 60 },
  { promptId: 'e', z: 37, via: 'type', tier: 'rare', points: 80 },
  { promptId: 'f', z: 74, via: 'type', tier: 'mole', points: 100 },
  { promptId: 'g', z: null, via: 'timeout', tier: null, points: 0 },
];

describe('shareText', () => {
  it('formats the header and tier squares', () => {
    expect(shareText({ digNumber: 1, answers, points: 315 })).toBe('OBSCURIUM #001 ⛏ 315 pts · -3,150 m\n🟫🟧🟨⬜🟪⚛️⬛');
    expect(shareText({ digNumber: 12, answers, points: 315 })).toBe('OBSCURIUM #012 ⛏ 315 pts · -3,150 m\n🟫🟧🟨⬜🟪⚛️⬛');
  });

  it('uses 🟦 for Technically Correct', () => {
    const t = shareText({ digNumber: 1, answers: [{ promptId: 'x', z: 87, via: 'type', tier: 'technical', points: 15 }], points: 15 });
    expect(t.endsWith('🟦')).toBe(true);
  });

  it('never leaks an element name or symbol', () => {
    const text = shareText({ digNumber: 1, answers, points: 315 });
    const words = text.split(/[^A-Za-z]+/).filter(Boolean);
    // (the game title itself contains "curium", so check everything after it)
    const body = text.replace(/^OBSCURIUM/, '').toLowerCase();
    for (const e of ELEMENTS) {
      expect(body).not.toContain(e.name.toLowerCase());
      if (e.symbol.length > 1) expect(words).not.toContain(e.symbol);
    }
    // the only letters present are the game title, "pts" and "m"
    expect(words).toEqual(['OBSCURIUM', 'pts', 'm']);
  });

  it('labels pack runs instead of a dig number', () => {
    expect(shareText({ digNumber: null, packLabel: 'HALF-LIFE HALLOWEEN', answers: [], points: 0 })).toBe(
      'OBSCURIUM · HALF-LIFE HALLOWEEN ⛏ 0 pts · -0 m\n',
    );
  });
});
