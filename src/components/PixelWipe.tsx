import { createContext, useCallback, useContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import { sfx } from '../audio/sfx';
import { blockThresholds, paintBlocks } from '../lib/pixelPattern';
import { PALETTE } from '../scene/palette';
import { useReducedMotion } from '../state/save';

/** Run `change` behind a full-screen pixel wipe. */
type Wipe = (change: () => void) => void;

const WipeCtx = createContext<Wipe>((change) => change());

const BLOCK = 28;
const COVER_MS = 240;
const UNCOVER_MS = 340;
const BOOT_MS = 520;

const nextFrame = () => new Promise<number>((r) => requestAnimationFrame(r));

type Grid = { cols: number; rows: number; th: Float32Array };

/**
 * Page transitions: chunky blocks sweep across the screen (copper and lilac on the leading
 * edge, like the wordmark's ghosts), the page changes while it's covered, then the same
 * sweep carries on and uncovers the new page.
 */
export function PixelWipeProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  /** true only while the screen is covering (clicks blocked); the uncover is click-through */
  const busy = useRef(false);
  /** bumps on every new transition so an older one stops drawing */
  const gen = useRef(0);

  const ctx = () => {
    try {
      return canvas.current?.getContext('2d') ?? null;
    } catch {
      return null;
    }
  };

  const paint = (g: CanvasRenderingContext2D, { cols, rows, th }: Grid, p: number, dir: 'in' | 'out') => {
    g.clearRect(0, 0, cols, rows);
    const { fill, edge } = paintBlocks(th, p, dir, 0.08);
    g.fillStyle = PALETTE.deep;
    for (const i of fill) g.fillRect(i % cols, Math.floor(i / cols), 1, 1);
    for (const i of edge) {
      g.fillStyle = i % 4 === 0 ? PALETTE.lilac : i % 4 === 1 ? PALETTE.copper : PALETTE.deep;
      g.fillRect(i % cols, Math.floor(i / cols), 1, 1);
    }
  };

  const animate = async (g: CanvasRenderingContext2D, grid: Grid, dir: 'in' | 'out', ms: number, id: number) => {
    const start = performance.now();
    for (;;) {
      if (gen.current !== id) return false;
      const p = Math.min(1, (performance.now() - start) / ms);
      paint(g, grid, p, dir);
      if (p >= 1) return true;
      await nextFrame();
    }
  };

  const setup = (): Grid => {
    const c = canvas.current!;
    const cols = Math.ceil(window.innerWidth / BLOCK) + 1;
    const rows = Math.ceil(window.innerHeight / BLOCK) + 1;
    c.width = cols;
    c.height = rows;
    c.style.width = `${cols * BLOCK}px`;
    c.style.height = `${rows * BLOCK}px`;
    c.style.display = 'block';
    c.style.pointerEvents = 'auto';
    return { cols, rows, th: blockThresholds(cols, rows, 'diagonal', Math.floor(Math.random() * 1e6)) };
  };

  const hide = (id: number) => {
    if (gen.current !== id) return; // a newer transition owns the canvas
    if (canvas.current) canvas.current.style.display = 'none';
    busy.current = false;
  };

  const wipe = useCallback<Wipe>(
    (change) => {
      const g = ctx();
      if (reduced || !g) {
        change();
        return;
      }
      if (busy.current) return; // ignore double clicks mid-transition
      busy.current = true;
      const id = ++gen.current;
      sfx.wipe();
      const grid = setup();
      void (async () => {
        try {
          await animate(g, grid, 'in', COVER_MS, id);
          change();
          // let React commit the new page before uncovering it
          await nextFrame();
          await nextFrame();
          // the new page is visible from here on, so let clicks through
          busy.current = false;
          if (canvas.current) canvas.current.style.pointerEvents = 'none';
          await animate(g, grid, 'out', UNCOVER_MS, id);
        } finally {
          hide(id);
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced],
  );

  // Boot: cover synchronously before the first paint, then pixel the first screen in.
  useLayoutEffect(() => {
    const g = ctx();
    if (reduced || !g) return;
    const id = ++gen.current;
    const grid = setup();
    paint(g, grid, 1, 'in');
    const timer = setTimeout(async () => {
      if (canvas.current) canvas.current.style.pointerEvents = 'none';
      await animate(g, grid, 'out', BOOT_MS, id);
      hide(id);
    }, 160);
    return () => {
      clearTimeout(timer);
      hide(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WipeCtx.Provider value={wipe}>
      {children}
      <canvas ref={canvas} className="pixel-wipe" aria-hidden="true" />
    </WipeCtx.Provider>
  );
}

export const usePixelWipe = () => useContext(WipeCtx);
