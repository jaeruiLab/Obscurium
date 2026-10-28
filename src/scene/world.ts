/** World scale: 1 internal pixel = 2.5 m, so ticks every 10 m land every 4 px. */
export const M_PER_PX = 2.5;
export const depthToPx = (m: number) => m / M_PER_PX;
/** World is drawn down to 8,000 m so the mantle shows below the Moho (7,000 m). */
export const WORLD_DEPTH_PX = depthToPx(8000);
/** Where the drill bit rests at 0 m, just under the grass. */
export const DRILL_START_PX = 6;

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
const scale = (a: RGB, k: number): RGB => a.map((v) => Math.round(v * k)) as RGB;

/** Deterministic per-pixel hash noise in [0, 1). */
export function hash2(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

const TOPSOIL_TOP = hex('#7a5236');
const TOPSOIL_BOTTOM = hex('#5c3e29');
const HUMUS = hex('#4a3222');
const CLAY_LINE = hex('#87603f');
const PEBBLE = hex('#a3825f');
const SEDIMENT = ['#b88d5c', '#a57a4c', '#c9a06a', '#8f6a45', '#b0855a', '#9c7048', '#c29462'].map(hex);
const SHALE = hex('#6e5238');
const GRANITE = hex('#8a7c7a');
const GRANITE_PINK = hex('#a1847f');
const GRANITE_WHITE = hex('#b9afaa');
const GRANITE_DARK = hex('#5e5456');
const BASALT_TOP = hex('#433f4a');
const BASALT_BOTTOM = hex('#2a2830');
const BASALT_JOINT = hex('#211f26');
const OLIVINE = hex('#56613f');
const MANTLE = hex('#4f1f12');
const MAGMA = hex('#c2451a');
const MAGMA_HOT = hex('#ff7a2f');

const px = (m: number) => depthToPx(m);

/** Color of the ground at world pixel (x, y), y = 0 at the surface. */
export function groundColor(x: number, y: number): RGB {
  const n = hash2(x, y);
  if (y < px(500)) {
    if (y < 3) return HUMUS;
    let c = mix(TOPSOIL_TOP, TOPSOIL_BOTTOM, y / px(500));
    const wave = Math.round(Math.sin(x * 0.07 + Math.floor(y / 24)) * 1.5);
    if ((y + wave) % 24 === 0) c = CLAY_LINE;
    if (n < 0.015) c = PEBBLE;
    else if (n > 0.985) c = scale(c, 0.8);
    return c;
  }
  if (y < px(2000)) {
    const local = y - px(500);
    const wave = Math.round(Math.sin(x * 0.045 + local * 0.01) * 2 + Math.sin(x * 0.13) * 1);
    const layer = Math.floor((local + wave) / 9);
    let c = SEDIMENT[((layer * 5) % SEDIMENT.length + SEDIMENT.length) % SEDIMENT.length];
    if (layer % 11 === 0) c = SHALE;
    if (n < 0.02) c = scale(c, 1.1);
    return scale(c, 1 - (local / (px(2000) - px(500))) * 0.28);
  }
  if (y < px(4500)) {
    const t = (y - px(2000)) / (px(4500) - px(2000));
    // 2×2 grains read as crystals rather than static
    const grain = hash2(Math.floor(x / 2), Math.floor(y / 2));
    let c = GRANITE;
    if (grain < 0.06) c = GRANITE_PINK;
    else if (grain < 0.085) c = GRANITE_WHITE;
    else if (grain > 0.955) c = GRANITE_DARK;
    else if (n < 0.04) c = scale(GRANITE, 1.06);
    return scale(c, 0.92 - t * 0.3);
  }
  if (y < px(7000)) {
    const t = (y - px(4500)) / (px(7000) - px(4500));
    const block = Math.floor(y / 26);
    const jointX = (x + block * 5) % 9 === 0;
    let c = mix(BASALT_TOP, BASALT_BOTTOM, t);
    if (jointX || y % 26 === 0) c = BASALT_JOINT;
    else if (n < 0.01) c = OLIVINE;
    return c;
  }
  // The Moho and the mantle below it
  const local = y - px(7000);
  if (local < 2) return MAGMA_HOT;
  // meandering lava streaks
  const vein = Math.sin(y * 0.16 + Math.sin(x * 0.05) * 2.2 + Math.sin(x * 0.017 + y * 0.01) * 3);
  if (vein > 0.95) return MAGMA_HOT;
  if (vein > 0.8) return MAGMA;
  return n < 0.03 ? MAGMA : mix(MANTLE, hex('#2a0f09'), Math.min(1, local / 200));
}

/** Pre-render the full ground column (width w) once; cheap to blit every frame. */
export function renderGround(w: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = WORLD_DEPTH_PX;
  const g = c.getContext('2d')!;
  const img = g.createImageData(w, WORLD_DEPTH_PX);
  for (let y = 0; y < WORLD_DEPTH_PX; y++) {
    for (let x = 0; x < w; x++) {
      const [r, gr, b] = groundColor(x, y);
      const i = (y * w + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = gr;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Brighter stratum color for dust particles at a depth. */
export function dustColor(depthPx: number): string {
  const [r, g, b] = scale(groundColor(7, Math.max(4, Math.floor(depthPx))), 1.35).map((v) => Math.min(255, v));
  return `rgb(${r},${g},${b})`;
}
