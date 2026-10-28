import { mulberry32 } from '../lib/rng';
import { PALETTE } from './palette';
import { AMMONITE, CLOUD_SHAPES, CRYSTALS, drawSprite, drawText, MOLE, textWidth, TRILOBITE } from './sprites';
import { DRILL_START_PX, hash2, M_PER_PX } from './world';

export type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string };
export type Cloud = { shape: number; x: number; y: number; speed: number };
type Item = { kind: 'fleck' | 'crystal' | 'ammonite' | 'trilobite'; fx: number; y: number; phase: number; variant: number };

export type SceneState = {
  W: number;
  H: number;
  t: number;
  camTop: number;
  drillPx: number;
  moleX: number;
  moleY: number;
  titleBlend: number;
  shake: number;
  ground: HTMLCanvasElement | null;
  particles: Particle[];
  clouds: Cloud[];
  chunks: Map<number, Item[]>;
};

/** The rig sits at the left edge so the mole on the drill head stays visible beside the prompt card. */
export const rigX = (s: SceneState) => Math.max(30, Math.round(s.W * 0.13));
const GRAPHITE = '#1d2027';
const GRAPHITE_HI = '#2e333d';
const STEEL = '#8d949e';
const STEEL_HI = '#c9ced6';

type RGB = [number, number, number];
const rgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const SKY_TOP = rgb(PALETTE.skyTop);
const SKY_HORIZON = rgb(PALETTE.skyHorizon);

function pixelDisc(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy));
    g.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2 + 1, 1);
  }
}

function line(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

export function drawSky(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  const skyHeight = Math.round(s.H * 0.62);
  const bands = 14;
  for (let y = 0; y < s.H; y++) {
    const wy = cam + y;
    if (wy >= 0) break;
    const t = Math.max(0, Math.min(1, 1 + wy / skyHeight));
    const q = Math.round(t * bands) / bands;
    const c = SKY_TOP.map((v, i) => Math.round(v + (SKY_HORIZON[i] - v) * q));
    g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    g.fillRect(0, y, s.W, 1);
  }
}

export function drawSun(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  const cx = Math.max(24, Math.round(s.W * 0.1));
  const cy = Math.round(-s.H * 0.12) - cam;
  const rings: [number, string][] = [
    [46, 'rgba(255,170,100,0.10)'],
    [32, 'rgba(255,170,100,0.14)'],
    [21, 'rgba(255,190,120,0.22)'],
    [12, '#ffd9a0'],
    [8, '#fff0d4'],
  ];
  for (const [r, c] of rings) {
    g.fillStyle = c;
    pixelDisc(g, cx, cy, r);
  }
}

export function drawClouds(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  for (const c of s.clouds) {
    const shape = CLOUD_SHAPES[c.shape];
    const x = Math.round(c.x);
    const y = Math.round(c.y - cam);
    g.fillStyle = '#efc7a8';
    for (const [rx, ry, rw, rh] of shape) g.fillRect(x + rx, y + ry + 1, rw, rh);
    g.fillStyle = '#fff6ea';
    for (const [rx, ry, rw, rh] of shape) g.fillRect(x + rx, y + ry, rw, rh - 1);
  }
}

export function makeClouds(W: number, H: number): Cloud[] {
  const rng = mulberry32(7);
  return [0, 1, 2, 3].map((i) => ({
    shape: i,
    x: rng() * W,
    y: -H * (0.5 - i * 0.09) + rng() * 10,
    speed: 1.5 + i * 0.9,
  }));
}

export function drawHills(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  for (let x = 0; x < s.W; x++) {
    const far = 3 + Math.round(2.5 * Math.sin(x * 0.028) + 1.8 * Math.sin(x * 0.071 + 1.3) + 1.5);
    g.fillStyle = '#f0c29d';
    g.fillRect(x, -far - cam, 1, far);
    // flat-topped mesa on the right
    const m0 = s.W * 0.74;
    const m1 = s.W * 0.9;
    if (x > m0 && x < m1) {
      const edge = Math.min(x - m0, m1 - x);
      const h = edge < 4 ? Math.round(edge * 2.5) : 10 + (Math.floor(x / 7) % 2);
      g.fillStyle = '#e7ae86';
      g.fillRect(x, -h - cam, 1, h);
    }
  }
}

export function drawGround(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  if (!s.ground) return;
  const top = Math.max(0, cam);
  const screenY = top - cam;
  const h = Math.min(s.ground.height - top, s.H - screenY);
  if (h > 0) g.drawImage(s.ground, 0, top, s.W, h, 0, screenY, s.W, h);
}

export function drawGrass(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  for (let x = 0; x < s.W; x++) {
    const tuft = hash2(x, 3) > 0.7 ? 1 : 0;
    g.fillStyle = '#7f9a52';
    g.fillRect(x, -2 - tuft - cam, 1, 2 + tuft);
    g.fillStyle = '#5c7638';
    g.fillRect(x, -cam, 1, 1);
  }
}

function itemsForChunk(s: SceneState, chunk: number): Item[] {
  const hit = s.chunks.get(chunk);
  if (hit) return hit;
  const rng = mulberry32(1000 + chunk);
  const items: Item[] = [];
  const y0 = chunk * 64;
  const clusters = 1 + Math.floor(rng() * 2);
  for (let c = 0; c < clusters; c++) {
    const fx = 0.04 + rng() * 0.9;
    const cy = y0 + rng() * 64;
    const n = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < n; i++) {
      items.push({ kind: 'fleck', fx: fx + (rng() - 0.5) * 0.06, y: cy + (rng() - 0.5) * 18, phase: rng() * 6.28, variant: Math.floor(rng() * 3) });
    }
  }
  if (rng() < (y0 > 200 ? 0.7 : 0.3)) items.push({ kind: 'crystal', fx: 0.05 + rng() * 0.88, y: y0 + rng() * 60, phase: rng() * 6.28, variant: Math.floor(rng() * 3) });
  if (y0 < 800 && rng() < 0.45) items.push({ kind: rng() < 0.55 ? 'ammonite' : 'trilobite', fx: 0.05 + rng() * 0.88, y: y0 + 4 + rng() * 54, phase: 0, variant: 0 });
  const kept = items.filter((it) => it.y > 6);
  s.chunks.set(chunk, kept);
  return kept;
}

const FLECK_COLORS = ['#fff1d0', '#d9c6ff', '#a8f5d6'];

export function drawMinerals(g: CanvasRenderingContext2D, s: SceneState, cam: number, still: boolean) {
  const first = Math.max(0, Math.floor(cam / 64));
  const last = Math.floor((cam + s.H) / 64);
  const rx = rigX(s);
  for (let ch = first; ch <= last; ch++) {
    for (const it of itemsForChunk(s, ch)) {
      const x = Math.round(it.fx * s.W);
      if (Math.abs(x - rx) < 10) continue;
      const y = Math.round(it.y - cam);
      if (it.kind === 'fleck') {
        const tw = still ? 0.6 : 0.25 + 0.75 * Math.max(0, Math.sin(s.t * 1.6 + it.phase)) ** 6;
        g.globalAlpha = tw;
        g.fillStyle = FLECK_COLORS[it.variant];
        g.fillRect(x, y, 1, 1);
        g.globalAlpha = 1;
      } else if (it.kind === 'crystal') {
        drawSprite(g, CRYSTALS[it.variant], x - 2, y - 4);
        if (!still && Math.sin(s.t * 1.3 + it.phase) > 0.92) {
          g.fillStyle = '#ffffff';
          g.fillRect(x, y - 4, 1, 1);
        }
      } else {
        drawSprite(g, it.kind === 'ammonite' ? AMMONITE : TRILOBITE, x - 3, y - 3);
      }
    }
  }
}

export function drawRig(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  const x0 = rigX(s);
  const base = -3 - cam;
  const top = -48 - cam;
  g.fillStyle = GRAPHITE;
  // derrick legs + braces
  const half = (y: number) => Math.round(2 + ((y - top) / (base - top)) * 7);
  for (let y = top; y <= base; y++) {
    g.fillRect(x0 - half(y), y, 1, 1);
    g.fillRect(x0 + half(y), y, 1, 1);
  }
  for (let y = top + 6; y <= base; y += 7) {
    g.fillRect(x0 - half(y), y, half(y) * 2 + 1, 1);
    const y2 = Math.min(base, y + 7);
    line(g, x0 - half(y), y, x0 + half(y2), y2);
    line(g, x0 + half(y), y, x0 - half(y2), y2);
  }
  // crown block, pennant pole and amber pennant
  g.fillRect(x0 - 3, top - 3, 7, 3);
  g.fillRect(x0, top - 13, 1, 10);
  g.fillStyle = PALETTE.sodium;
  const widths = [8, 7, 5, 3, 1];
  widths.forEach((w, r) => {
    const wave = Math.round(Math.sin(s.t * 4 - r * 0.9) * 0.6);
    g.fillRect(x0 + 1, top - 13 + r, Math.max(1, w + wave), 1);
  });
  // platform + doghouse cabin with a lit window
  g.fillStyle = GRAPHITE;
  g.fillRect(x0 - 16, base, 38, 3);
  g.fillRect(x0 + 8, base - 11, 14, 11);
  g.fillStyle = GRAPHITE_HI;
  g.fillRect(x0 + 7, base - 12, 16, 1);
  g.fillRect(x0 - 16, base, 38, 1);
  g.fillStyle = '#ffcf7a';
  g.fillRect(x0 + 16, base - 8, 3, 3);
  g.fillStyle = 'rgba(255,207,122,0.25)';
  g.fillRect(x0 + 15, base - 9, 5, 5);
  // support legs into the ground
  g.fillStyle = GRAPHITE;
  g.fillRect(x0 - 15, base + 3, 1, 1);
  g.fillRect(x0 + 20, base + 3, 1, 1);
}

export function drawDrill(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  const x0 = rigX(s);
  const headY = Math.round(s.drillPx - cam);
  const from = -44 - cam;
  // traveling block
  g.fillStyle = GRAPHITE_HI;
  g.fillRect(x0 - 1, -38 - cam, 3, 3);
  for (let y = from; y < headY - 2; y++) {
    const joint = (y + cam) % 12 === 0;
    g.fillStyle = joint ? STEEL_HI : STEEL;
    g.fillRect(joint ? x0 - 1 : x0, y, joint ? 3 : 1, 1);
  }
  // bit
  g.fillStyle = STEEL_HI;
  g.fillRect(x0 - 2, headY - 2, 5, 1);
  g.fillRect(x0 - 1, headY - 1, 3, 1);
  g.fillRect(x0, headY, 1, 1);
}

export function drawParticles(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  for (const p of s.particles) {
    g.globalAlpha = Math.max(0, p.life / p.max);
    g.fillStyle = p.color;
    g.fillRect(Math.round(p.x), Math.round(p.y - cam), 1, 1);
  }
  g.globalAlpha = 1;
}

export function drawMole(g: CanvasRenderingContext2D, s: SceneState, cam: number, still: boolean) {
  const bob = still || s.titleBlend < 0.5 ? 0 : Math.round(Math.sin(s.t * 2.2) * 1.2);
  const x = Math.round(s.moleX);
  const y = Math.round(s.moleY - cam + bob);
  // headlamp glow
  const lx = x + 10;
  const ly = y + 2;
  const pulse = still ? 0.42 : 0.38 + Math.sin(s.t * 3) * 0.06;
  const grad = g.createRadialGradient(lx, ly, 0, lx, ly, 18);
  grad.addColorStop(0, `rgba(255,190,90,${pulse})`);
  grad.addColorStop(0.5, `rgba(255,170,64,${pulse * 0.35})`);
  grad.addColorStop(1, 'rgba(255,170,64,0)');
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = grad;
  g.fillRect(lx - 18, ly - 18, 36, 36);
  g.globalCompositeOperation = 'source-over';
  drawSprite(g, MOLE, x, y);
}

export function drawGauge(g: CanvasRenderingContext2D, s: SceneState, cam: number) {
  const right = s.W - 2;
  const zero = DRILL_START_PX;
  g.fillStyle = 'rgba(236,228,214,0.22)';
  g.fillRect(right, Math.max(0, zero - cam), 1, s.H);
  const firstM = Math.max(0, Math.floor(((cam - zero) * M_PER_PX) / 10) * 10);
  for (let m = firstM; ; m += 10) {
    const y = Math.round(zero + m / M_PER_PX - cam);
    if (y > s.H) break;
    if (y < 0) continue;
    const major = m % 100 === 0;
    const mid = m % 50 === 0;
    g.fillStyle = major ? 'rgba(236,228,214,0.6)' : 'rgba(236,228,214,0.3)';
    const len = major ? 5 : mid ? 3 : 2;
    g.fillRect(right - len, y, len, 1);
    // keep labels clear of the corner buttons
    if (major && m > 0 && y > s.H * 0.2) {
      const label = `-${m}m`;
      drawText(g, label, right - 7 - textWidth(label), y - 2, 'rgba(236,228,214,0.62)');
    }
  }
  // marker at the drill head
  const my = Math.round(s.drillPx - cam);
  if (my > 0 && my < s.H && s.titleBlend < 0.5) {
    g.fillStyle = PALETTE.sodium;
    g.fillRect(right - 3, my, 3, 1);
    g.fillRect(right - 2, my - 1, 1, 3);
    g.fillRect(right - 1, my - 2, 1, 5);
  }
}

export function drawTitleShade(g: CanvasRenderingContext2D, s: SceneState) {
  if (s.titleBlend <= 0.01) return;
  const start = Math.round(s.H * 0.66);
  const bands = 10;
  const span = s.H - start;
  for (let i = 0; i < bands; i++) {
    const y = start + Math.round((span * i) / bands);
    const h = Math.round((span * (i + 1)) / bands) - Math.round((span * i) / bands);
    g.fillStyle = `rgba(8,9,11,${((i + 1) / bands) * 0.9 * s.titleBlend})`;
    g.fillRect(0, y, s.W, h);
  }
  // faint mantle glow at the very bottom
  for (let i = 0; i < 4; i++) {
    g.fillStyle = `rgba(255,110,40,${(0.05 + i * 0.03) * s.titleBlend})`;
    g.fillRect(0, s.H - 8 + i * 2, s.W, 2);
  }
}
