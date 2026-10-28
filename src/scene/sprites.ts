/** Tiny pixel sprites defined as strings; '.' is transparent. */
export type Sprite = { rows: string[]; colors: Record<string, string> };

export function drawSprite(g: CanvasRenderingContext2D, s: Sprite, x: number, y: number, flip = false) {
  const w = s.rows[0].length;
  for (let r = 0; r < s.rows.length; r++) {
    const row = s.rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      g.fillStyle = s.colors[ch];
      g.fillRect(Math.round(x + (flip ? w - 1 - c : c)), Math.round(y + r), 1, 1);
    }
  }
}

/** The mole: hard hat with headlamp, facing right. 12×12. */
export const MOLE: Sprite = {
  rows: [
    '....yyyy....',
    '...yYYYYy...',
    '..yYYYYYYLL.',
    '.dddddddddd.',
    '..bBBBBBBB..',
    '.bBBBBBBkBB.',
    '.bBBBBBBBBPP',
    '.bBBBBBBBBB.',
    '..bBBBBBBBc.',
    '..bbBBBBBcc.',
    '...bbbbbbb..',
    '...cc...cc..',
  ],
  colors: {
    y: '#d98a1f',
    Y: '#ffb340',
    L: '#fff3c4',
    d: '#a8661a',
    B: '#6e5b52',
    b: '#4a3c36',
    k: '#08090b',
    P: '#f08aa0',
    c: '#f3e3c8',
  },
};

export const AMMONITE: Sprite = {
  rows: ['..xxx..', '.x...x.', 'x..xx.x', 'x.x.x.x', 'x.x..x.', '.x.xx..', '..x....'],
  colors: { x: 'rgba(40,24,14,0.55)' },
};

export const TRILOBITE: Sprite = {
  rows: ['.xxxxx.', 'xxxxxxx', 'x.xxx.x', '.xxxxx.', 'x.xxx.x', '.xxxxx.', '..xxx..'],
  colors: { x: 'rgba(40,24,14,0.5)' },
};

export function crystal(main: string, light: string): Sprite {
  return {
    rows: ['..h..', '.ch..', '.cc.h', 'ccc.c', 'ccccc'],
    colors: { c: main, h: light },
  };
}

export const CRYSTALS = [
  crystal('#8f6bd6', '#d9c6ff'), // lilac (fluorite-ish)
  crystal('#2fa27a', '#a8f5d6'), // copper green (malachite-ish)
  crystal('#d48a2a', '#ffe0a8'), // amber (citrine-ish)
];

/** Stair-stepped cloud shapes as [x, y, w, h] rect lists. */
export const CLOUD_SHAPES: [number, number, number, number][][] = [
  [[0, 8, 38, 5], [5, 4, 22, 5], [11, 0, 10, 5], [24, 6, 10, 3]],
  [[0, 6, 28, 4], [4, 2, 14, 5], [17, 4, 8, 3]],
  [[0, 10, 52, 5], [6, 6, 30, 5], [14, 1, 13, 6], [32, 4, 14, 7], [36, 1, 6, 4]],
  [[0, 5, 20, 4], [4, 1, 10, 5]],
];

/** 3×5 pixel font for the depth gauge (5 wide for "m"). */
export const GLYPHS: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '-': ['000', '000', '111', '000', '000'],
  m: ['00000', '11010', '10101', '10101', '10101'],
};

export function textWidth(s: string) {
  return [...s].reduce((w, ch) => w + (GLYPHS[ch]?.[0].length ?? 3) + 1, -1);
}

export function drawText(g: CanvasRenderingContext2D, s: string, x: number, y: number, color: string) {
  g.fillStyle = color;
  let cx = Math.round(x);
  for (const ch of s) {
    const glyph = GLYPHS[ch];
    if (glyph) {
      glyph.forEach((row, r) => [...row].forEach((bit, c) => bit === '1' && g.fillRect(cx + c, Math.round(y) + r, 1, 1)));
      cx += glyph[0].length + 1;
    } else cx += 4;
  }
}
