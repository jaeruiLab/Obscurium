import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrast';
import { CATEGORY_COLOR, PALETTE, TIER_COLOR } from './palette';

const AA = 4.5;
const AA_LARGE = 3;

describe('palette contrast (WCAG AA)', () => {
  it.each([
    ['body on panel', PALETTE.body, PALETTE.panel, AA],
    ['muted on panel', PALETTE.muted, PALETTE.panel, AA],
    ['copper on panel', PALETTE.copper, PALETTE.panel, AA],
    ['lilac on panel', PALETTE.lilac, PALETTE.panel, AA],
    ['sodium on panel', PALETTE.sodium, PALETTE.panel, AA],
    ['lithium on panel', PALETTE.lithium, PALETTE.panel, AA],
    ['body on deep', PALETTE.body, PALETTE.deep, AA],
    ['ink on sky top', PALETTE.ink, PALETTE.skyTop, AA],
    ['ink on horizon', PALETTE.ink, PALETTE.skyHorizon, AA],
    ['copper ink on sky top', PALETTE.copperInk, PALETTE.skyTop, AA],
    ['deep text on copper button', PALETTE.deep, PALETTE.copper, AA],
  ])('%s', (_, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('tier and category colors read on the panel (large text / UI)', () => {
    for (const c of [...Object.values(TIER_COLOR), ...Object.values(CATEGORY_COLOR)]) {
      expect(contrastRatio(c, PALETTE.panel), c).toBeGreaterThanOrEqual(AA_LARGE);
    }
  });

  it('dark tile text reads on every tier and category fill', () => {
    for (const c of [...Object.values(TIER_COLOR), ...Object.values(CATEGORY_COLOR)]) {
      expect(contrastRatio(PALETTE.deep, c), c).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe('tokens.css stays in sync with palette.ts', () => {
  const css = readFileSync(join(__dirname, '../styles/tokens.css'), 'utf8');
  it.each(Object.entries(PALETTE))('--%s', (name, hex) => {
    expect(css).toContain(`--${name}: ${hex};`);
  });
  it.each(Object.entries(TIER_COLOR))('--tier-%s', (name, hex) => {
    expect(css).toContain(`--tier-${name}: ${hex};`);
  });
});
