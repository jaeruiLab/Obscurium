import { describe, expect, it } from 'vitest';
import { buildPrompts } from '../../scripts/promptBuild';
import { CHALLENGE_PROMPTS, DAILY_PROMPTS, PROMPTS } from '../lib/daily';
import { bySym, el, ELEMENTS } from '../lib/elements';
import { invalidReason, renderTemplate, validReason } from '../lib/reasons';

const syms = (zs: number[]) => zs.map((z) => el(z).symbol).sort();
const sorted = (s: string) => s.split(' ').sort();
const byId = (id: string) => PROMPTS.find((p) => p.id === id)!;

describe('prompts.json', () => {
  it('matches the generator output (run `npm run data:prompts` after editing promptDefs.ts)', () => {
    expect(PROMPTS).toEqual(buildPrompts());
  });

  const perCategory = (pool: typeof PROMPTS) => {
    const counts: Record<string, number> = {};
    for (const p of pool) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return counts;
  };

  it('has a broad daily bank: six gen-chem categories, at least six prompts each', () => {
    expect(DAILY_PROMPTS.length).toBeGreaterThanOrEqual(42);
    const counts = perCategory(DAILY_PROMPTS);
    expect(Object.keys(counts).sort()).toEqual(['CHEMICAL', 'ELECTRONS', 'PERIODIC TABLE', 'PHYSICAL', 'SYMBOLS', 'TRENDS']);
    for (const n of Object.values(counts)) expect(n).toBeGreaterThanOrEqual(6);
  });

  it('keeps the niche prompts in Challenge, at least three per category', () => {
    expect(CHALLENGE_PROMPTS.length).toBeGreaterThanOrEqual(20);
    for (const n of Object.values(perCategory(CHALLENGE_PROMPTS))) expect(n).toBeGreaterThanOrEqual(3);
    for (const id of ['ramsay', 'davy', 'discovered-1898', 'named-woman', 'myth-figure', 'state-postal']) {
      expect(byId(id).mode).toBe('challenge');
    }
  });

  it('gives daily prompts plenty of answers to dig through', () => {
    const answers = DAILY_PROMPTS.map((p) => p.validZ.length).sort((a, b) => a - b);
    expect(answers[Math.floor(answers.length / 2)]).toBeGreaterThanOrEqual(7); // median
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
    // daily gen-chem prompts (data-derived ones double as checks on elements.json)
    ['transition-metal', 'Sc Ti V Cr Mn Fe Co Ni Cu Zn Y Zr Nb Mo Tc Ru Rh Pd Ag Cd Hf Ta W Re Os Ir Pt Au Hg Rf Db Sg Bh Hs Mt Ds Rg Cn', 'La Ac Lu Lr'],
    ['halogen', 'F Cl Br I At Ts', ''],
    ['nonmetal', 'H He C N O F Ne P S Cl Ar Se Br Kr I Xe Rn', 'At'],
    ['post-transition', 'Al Ga In Sn Tl Pb Bi Po', 'Zn Cd Hg'],
    ['diatomic', 'H N O F Cl Br I', 'At'],
    ['en-above-carbon', 'N O F S Cl Br I', 'Kr Xe'],
    ['ie-above-hydrogen', 'He N O F Ne Ar Kr', ''],
    ['ie-below-lithium', 'Na K Rb Cs Fr Ba Ra Ac', 'Lr'],
    ['ie-dip', 'Li B O Na Al S K Ga Se Rb In Cs Tl Bi Fr', ''],
    ['melts-above-2000', 'B Nb Mo Tc Ru Hf Ta W Re Os Ir', 'C'],
    ['metal-melts-below-100', 'Hg Cs Ga Rb K Na', 'Fr'],
    ['not-solid', 'H He N O F Ne Cl Ar Kr Xe Rn Br Hg', 'Cs Ga Fr Cn'],
    ['aufbau-exception', 'Cr Cu Nb Mo Ru Rh Pd Ag Pt Au La Ce Gd Ac Th Pa U Np Cm', 'Lr'],
    ['s-block', 'H He Li Be Na Mg K Ca Rb Sr Cs Ba Fr Ra', ''],
    ['one-valence', 'H Li Na K Rb Cs Fr', 'Cu Ag Au'],
    ['two-valence', 'He Be Mg Ca Sr Ba Ra', 'Zn Cd Hg'],
    ['half-filled-p', 'N P As Sb Bi', 'Mc'],
    ['short-name', 'Sn Fe Au Pb Ne Zn', ''],
    ['mass-inversion', 'K Ni I Pa Np', 'Am Bk'],
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
