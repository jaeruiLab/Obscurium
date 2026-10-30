import { describe, expect, it } from 'vitest';
import { blockThresholds, paintBlocks } from './pixelPattern';

describe('blockThresholds', () => {
  it('gives every block a threshold strictly inside (0, 1)', () => {
    for (const p of ['sweep', 'diagonal', 'radial', 'dither'] as const) {
      const th = blockThresholds(20, 12, p, 7);
      expect(th).toHaveLength(240);
      for (const t of th) {
        expect(t).toBeGreaterThan(0);
        expect(t).toBeLessThan(1);
      }
    }
  });

  it('is deterministic for a seed', () => {
    expect(blockThresholds(9, 9, 'diagonal', 3)).toEqual(blockThresholds(9, 9, 'diagonal', 3));
  });

  it('sweeps top to bottom on average', () => {
    const cols = 16;
    const th = blockThresholds(cols, 10, 'sweep', 1);
    const rowAvg = (y: number) => th.slice(y * cols, (y + 1) * cols).reduce((a, b) => a + b, 0) / cols;
    expect(rowAvg(0)).toBeLessThan(rowAvg(9));
  });

  it('opens radially from the center', () => {
    const th = blockThresholds(11, 11, 'radial', 1);
    expect(th[5 * 11 + 5]).toBeLessThan(th[0]);
  });
});

describe('paintBlocks', () => {
  const th = blockThresholds(12, 8, 'diagonal', 2);
  const count = (p: { fill: number[]; edge: number[] }) => p.fill.length + p.edge.length;

  it('starts fully covered and ends clear when dissolving out', () => {
    expect(count(paintBlocks(th, 0, 'out'))).toBe(96);
    expect(count(paintBlocks(th, 1, 'out'))).toBe(0);
  });

  it('starts clear and ends fully covered when wiping in', () => {
    expect(count(paintBlocks(th, 0, 'in'))).toBe(0);
    expect(count(paintBlocks(th, 1, 'in'))).toBe(96);
  });

  it('only glows blocks at the moving front', () => {
    const mid = paintBlocks(th, 0.5, 'out');
    expect(mid.edge.length).toBeGreaterThan(0);
    for (const i of mid.edge) expect(th[i] - 0.5).toBeLessThan(0.07);
  });
});
