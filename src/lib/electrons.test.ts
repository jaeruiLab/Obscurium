import { describe, expect, it } from 'vitest';
import { bySym } from './elements';
import { AUFBAU_EXCEPTIONS, madelungConfiguration, MADELUNG_ORDER, outerShellElectrons, parseConfiguration } from './electrons';

describe('electron configurations', () => {
  it('fills subshells in Madelung order', () => {
    expect(MADELUNG_ORDER.slice(0, 10)).toEqual(['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d']);
    expect(madelungConfiguration(26)).toEqual({ '1s': 2, '2s': 2, '2p': 6, '3s': 2, '3p': 6, '4s': 2, '3d': 6 });
  });

  it('parses configurations with a noble-gas core', () => {
    expect(parseConfiguration('[Ar]3d5 4s1')).toMatchObject({ '3p': 6, '3d': 5, '4s': 1 });
    expect(parseConfiguration('1s1')).toEqual({ '1s': 1 });
  });

  it('finds the textbook Aufbau exceptions from the data', () => {
    expect(AUFBAU_EXCEPTIONS().sort()).toEqual(
      ['Cr', 'Cu', 'Nb', 'Mo', 'Ru', 'Rh', 'Pd', 'Ag', 'Pt', 'Au', 'La', 'Ce', 'Gd', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Cm'].sort(),
    );
  });

  it('counts outer-shell (valence) electrons', () => {
    expect(outerShellElectrons(bySym('Na')!)).toBe(1);
    expect(outerShellElectrons(bySym('He')!)).toBe(2);
    expect(outerShellElectrons(bySym('Cl')!)).toBe(7);
    expect(outerShellElectrons(bySym('Cu')!)).toBe(1); // 4s1 — but it isn't a main-group element
  });
});
