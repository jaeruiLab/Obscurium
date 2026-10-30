/**
 * Merge the PubChem snapshot with hand-curated fields → src/data/elements.json.
 * Run: npm run data:elements
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Block, Category, Element, Phase } from '../src/lib/types';
import { curated } from './curated/elements.curated';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(root, 'scripts/raw/pubchem-periodic-table.json'), 'utf8'));
const cols: string[] = raw.Table.Columns.Column;
const rows: Record<string, string>[] = raw.Table.Row.map((r: { Cell: string[] }) =>
  Object.fromEntries(cols.map((c, i) => [c, r.Cell[i]])),
);

const num = (s: string) => (s === '' || s == null ? null : Number(s));

const CATEGORY: Record<string, Category> = {
  'Nonmetal': 'nonmetal',
  'Noble gas': 'noble-gas',
  'Alkali metal': 'alkali',
  'Alkaline earth metal': 'alkaline-earth',
  'Metalloid': 'metalloid',
  'Halogen': 'halogen',
  'Transition metal': 'transition',
  'Post-transition metal': 'post-transition',
  'Lanthanide': 'lanthanide',
  'Actinide': 'actinide',
};

function periodOf(z: number) {
  if (z <= 2) return 1;
  if (z <= 10) return 2;
  if (z <= 18) return 3;
  if (z <= 36) return 4;
  if (z <= 54) return 5;
  if (z <= 86) return 6;
  return 7;
}

const PERIOD_START = [0, 1, 3, 11, 19, 37, 55, 87];

/** Returns [gridRow, gridCol, group, block]. f-block (La–Lu, Ac–Lr) goes to detached rows 9–10. */
function position(z: number): [number, number, number | null, Block] {
  const p = periodOf(z);
  if (z === 1) return [1, 1, 1, 's'];
  if (z === 2) return [1, 18, 18, 's'];
  if ((z >= 57 && z <= 71) || (z >= 89 && z <= 103)) {
    const first = z <= 71 ? 57 : 89;
    const row = z <= 71 ? 9 : 10;
    const isLuLr = z === 71 || z === 103;
    return [row, 3 + (z - first), null, isLuLr ? 'd' : 'f'];
  }
  const i = z - PERIOD_START[p]; // 0-based index within period
  let col: number;
  if (p <= 3) col = i < 2 ? i + 1 : i + 11; // s then p block
  else if (p <= 5) col = i + 1;
  else col = i < 2 ? i + 1 : i - 14 + 1; // skip 15 f-block slots (i=2..16)
  const block: Block = col <= 2 ? 's' : col <= 12 ? 'd' : 'p';
  return [p, col, col, block];
}

function phaseOf(s: string): Phase {
  if (s === 'Solid') return 'solid';
  if (s === 'Liquid') return 'liquid';
  if (s === 'Gas') return 'gas';
  return 'unknown';
}

const elements: Element[] = rows.map((r) => {
  const z = Number(r.AtomicNumber);
  const sym = r.Symbol;
  const c = curated[sym];
  if (!c) throw new Error(`No curated entry for ${sym}`);
  const [gridRow, gridCol, group, block] = position(z);
  const year = r.YearDiscovered === 'Ancient' ? null : num(r.YearDiscovered);
  const category = c.cat ?? CATEGORY[r.GroupBlock];
  if (!category) throw new Error(`Unmapped category ${r.GroupBlock} for ${sym}`);
  const el: Element = {
    z,
    symbol: sym,
    name: r.Name,
    altNames: c.alt ?? [],
    gridRow,
    gridCol,
    mass: Number(r.AtomicMass),
    group,
    period: periodOf(z),
    block,
    category,
    phaseSTP: c.phase ?? phaseOf(r.StandardState),
    meltK: c.meltK !== undefined ? c.meltK : num(r.MeltingPoint),
    boilK: c.boilK !== undefined ? c.boilK : num(r.BoilingPoint),
    density: c.density !== undefined ? c.density : num(r.Density),
    electronegativity: num(r.Electronegativity),
    ionizationEnergy: num(r.IonizationEnergy),
    // drop "(predicted)" notes and the stray space PubChem sometimes puts after the core
    electronConfiguration: r.ElectronConfiguration.replace(/\s*\((predicted|calculated)\)/, '').replace(/\]\s+/, ']').trim(),
    radioactive: c.stable === 0,
    stableIsotopes: c.stable,
    occurrence: c.occ,
    discoveryYear: c.year !== undefined ? c.year : year,
    discoverers: c.disc,
    etymology: { type: c.ety[0], detail: c.ety[1] },
    ...(c.latin ? { latinSymbolOrigin: c.latin } : {}),
    crustalAbundancePpm: c.ppm,
    funFact: c.fact,
  };
  return el;
});

if (elements.length !== 118) throw new Error(`Expected 118 elements, got ${elements.length}`);
const seen = new Set<string>();
for (const e of elements) {
  const key = `${e.gridRow},${e.gridCol}`;
  if (seen.has(key)) throw new Error(`Grid collision at ${key} (${e.symbol})`);
  seen.add(key);
}

writeFileSync(join(root, 'src/data/elements.json'), JSON.stringify(elements, null, 1) + '\n');
console.log(`Wrote ${elements.length} elements.`);
