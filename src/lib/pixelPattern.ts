import { mulberry32 } from './rng';

/** 4×4 ordered-dither (Bayer) matrix, normalized to [0, 1). */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16);

export type DissolvePattern = 'sweep' | 'diagonal' | 'radial' | 'dither';

/**
 * Per-block thresholds in (0, 1) for a cols×rows grid. A block flips when the transition's
 * progress passes its threshold. The pattern sets the overall direction; Bayer dithering plus
 * a little seeded jitter breaks the edge into a pixel-art staircase instead of a straight line.
 */
export function blockThresholds(cols: number, rows: number, pattern: DissolvePattern, seed = 1): Float32Array {
  const out = new Float32Array(cols * rows);
  const rng = mulberry32(seed);
  const nx = (x: number) => (cols > 1 ? x / (cols - 1) : 0);
  const ny = (y: number) => (rows > 1 ? y / (rows - 1) : 0);
  const spread = pattern === 'dither' ? 1 : 0.32;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let base: number;
      if (pattern === 'sweep') base = ny(y);
      else if (pattern === 'diagonal') base = (nx(x) * 0.6 + ny(y) * 0.4);
      else if (pattern === 'radial') base = Math.min(1, Math.hypot(nx(x) - 0.5, ny(y) - 0.5) / 0.7072);
      else base = 0;
      const dither = BAYER4[(y % 4) * 4 + (x % 4)] + rng() * 0.0625;
      const v = base * (1 - spread) + dither * spread;
      out[y * cols + x] = Math.min(0.999, Math.max(0.001, v));
    }
  }
  return out;
}

export type BlockPaint = { fill: number[]; edge: number[] };

/**
 * Which blocks to paint at `progress` (0 → 1).
 * 'out': blocks disappear as progress passes them (covered → clear).
 * 'in':  blocks appear as progress passes them (clear → covered).
 * Blocks within `edgeWidth` of the moving front are returned separately so they can glow.
 */
export function paintBlocks(th: Float32Array, progress: number, dir: 'in' | 'out', edgeWidth = 0.07): BlockPaint {
  const fill: number[] = [];
  const edge: number[] = [];
  for (let i = 0; i < th.length; i++) {
    const t = th[i];
    const covered = dir === 'out' ? t > progress : t < progress;
    if (!covered) continue;
    const nearFront = dir === 'out' ? t - progress < edgeWidth : progress - t < edgeWidth;
    (nearFront && progress > 0 && progress < 1 ? edge : fill).push(i);
  }
  return { fill, edge };
}
