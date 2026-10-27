import { describe, expect, it } from 'vitest';
import { buildPrompts } from '../../scripts/promptBuild';
import { PROMPTS } from '../lib/daily';
import { bySym, el, ELEMENTS } from '../lib/elements';
import { invalidReason, renderTemplate, validReason } from '../lib/reasons';

const syms = (zs: number[]) => zs.map((z) => el(z).symbol).sort();
const sorted = (s: string) => s.split(' ').sort();
const byId = (id: string) => PROMPTS.find((p) => p.id === id)!;

describe('prompts.json', () => {
  it('matches the generator output (run `npm run data:prompts` after editing promptDefs.ts)', () => {
    expect(PROMPTS).toEqual(buildPrompts());
  });

  it('has a reasonable bank', () => {
    expect(PROMPTS.length).toBeGreaterThanOrEqual(30);
    const perCategory: Record<string, number> = {};
    for (const p of PROMPTS) perCategory[p.category] = (perCategory[p.category] ?? 0) + 1;
    expect(Object.keys(perCategory)).toHaveLength(6);
    for (const n of Object.values(perCategory)) expect(n).toBeGreaterThanOrEqual(5);
    expect(PROMPTS.filter((p) => p.packs.includes('halloween')).length).toBeGreaterThanOrEqual(7);
  });

  // Hand-verified answer banks from the build spec's starter table.
  it.each([
    ['sym-not-english', 'Na K Fe Cu Ag Sn Sb W Au Hg Pb', ''],
    ['liquid-near-rt', 'Hg Br Cs Ga Rb', 'Fr Cn'],
    ['gas-stp', 'H He N O F Ne Cl Ar Kr Xe Rn', ''],
    ['named-person', 'Gd Cm Es Fm Md No Lr Rf Sg Bh Mt Rg Cn Og', 'Sm Fl'],
    ['celestial', 'He Se Te Ce Pd U Np Pu', 'Hg'],
    ['ends-ine', 'F Cl Br I At Ts', ''],
    ['one-letter', 'H B C N O F P S K V Y I W U', ''],
    ['ferromagnetic', 'Fe Co Ni', 'Gd'],
    ['noble-gas', 'He Ne Ar Kr Xe Rn', 'Og'],
    ['named-place', 'Ge Ga Fr Po Eu Am Bk Cf Sc Y Tb Er Yb Sr Ho Lu Hf Re Cu Mg Mn Ru Ds Hs Db Nh Mc Ts Lv', 'Tm'],
    ['alkali', 'Li Na K Rb Cs Fr', 'H'],
    ['metalloid', 'B Si Ge As Sb Te', 'Po At'],
    ['myth-figure', 'Ti V Nb Pm Th Ta', 'Hg Co Ni Ir'],
    ['named-color', 'Cl I Cr Rh Ir Cs Rb In Tl Pr', ''],
    ['group-11', 'Cu Ag Au Rg', ''],
    ['lanthanide', 'La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu', ''],
    ['state-postal', 'Al Ar Ca Co Fl Ga In La Md Mn Mo Mt Nd Ne Nh Pa Sc', ''],
    ['discovered-1898', 'Ne Kr Xe Po Ra', ''],
    ['melts-above-3000', 'W Re Os Ta', 'C'],
  ])('%s has the verified answer bank', (id, valid, edge) => {
    const p = byId(id);
    expect(syms(p.validZ)).toEqual(sorted(valid));
    expect(syms((p.edge ?? []).map((e) => e.z))).toEqual(edge ? sorted(edge) : []);
  });

  it('every Mole answer is valid and every reveal line renders from data', () => {
    for (const p of PROMPTS) {
      expect(p.validZ).toContain(p.moleZ);
      for (const z of p.validZ) {
        const custom = p.reasons?.[z];
        const rendered = p.reasonTemplate ? renderTemplate(p.reasonTemplate, el(z)) : null;
        expect(custom ?? rendered, `${p.id} / ${el(z).symbol}`).toBeTruthy();
        expect(validReason(p, z)).not.toMatch(/\{|\}|undefined|null/);
      }
      for (const e of ELEMENTS) {
        expect(invalidReason(p, e.z)).not.toMatch(/\{|\}|undefined|null/);
      }
    }
  });

  it('uses data that agrees with each prompt (spot checks)', () => {
    expect(el(37).meltK! - 273.15).toBeCloseTo(39.3, 1); // Rb
    expect(bySym('Os')!.density).toBeGreaterThan(22);
    expect(validReason(byId('liquid-near-rt'), 37)).toBe('Rubidium melts at 39.3 °C');
    expect(invalidReason(byId('gas-stp'), 35)).toBe('Bromine is a liquid at STP');
    expect(validReason(byId('liquid-near-rt'), 87)).toMatch(/^Francium: predicted/);
  });
});
