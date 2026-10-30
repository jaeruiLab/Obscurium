import { useLayoutEffect, useRef, useState } from 'react';
import { blockThresholds, paintBlocks, type DissolvePattern } from '../lib/pixelPattern';
import { PALETTE } from '../scene/palette';
import { useReducedMotion } from '../state/save';

type Props = {
  /** block size in CSS pixels */
  block?: number;
  duration?: number;
  delay?: number;
  pattern?: DissolvePattern;
  color?: string;
  /** glow color for blocks at the dissolving edge; null for none */
  accent?: string | null;
};

/**
 * Covers its (positioned) parent with solid pixel blocks on mount, then dissolves them away
 * block by block. One canvas pixel = one block, scaled up with image-rendering: pixelated.
 */
export function PixelDissolve({ block = 12, duration = 340, delay = 0, pattern = 'sweep', color = PALETTE.panel, accent = PALETTE.copper }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [done, setDone] = useState(reduced);

  useLayoutEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    let g: CanvasRenderingContext2D | null = null;
    try {
      g = canvas.getContext('2d');
    } catch {
      g = null;
    }
    if (!g) {
      setDone(true);
      return;
    }
    // overshoot by a block so late layout shifts never expose an edge
    const cols = Math.max(1, Math.ceil(parent.offsetWidth / block) + 1);
    const rows = Math.max(1, Math.ceil(parent.offsetHeight / block) + 1);
    canvas.width = cols;
    canvas.height = rows;
    canvas.style.width = `${cols * block}px`;
    canvas.style.height = `${rows * block}px`;
    const th = blockThresholds(cols, rows, pattern, Math.floor(Math.random() * 1e6));
    const ctx = g;
    const draw = (p: number) => {
      ctx.clearRect(0, 0, cols, rows);
      const { fill, edge } = paintBlocks(th, p, 'out');
      ctx.fillStyle = color;
      for (const i of fill) ctx.fillRect(i % cols, Math.floor(i / cols), 1, 1);
      // only every third block on the moving edge glows, so it sparkles instead of flooding
      for (const i of edge) {
        ctx.fillStyle = accent && i % 3 === 0 ? accent : color;
        ctx.fillRect(i % cols, Math.floor(i / cols), 1, 1);
      }
    };
    draw(0);
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      draw(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [block, duration, delay, pattern, color, accent]);

  if (done) return null;
  return <canvas ref={ref} className="pixel-dissolve" aria-hidden="true" />;
}
