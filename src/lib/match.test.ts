import { describe, expect, it } from 'vitest';
import { levenshtein, matchInput } from './match';

const exact = (z: number) => ({ kind: 'exact', z });

describe('matchInput', () => {
  it('accepts full names in any case, with stray spaces and punctuation', () => {
    expect(matchInput('Rubidium')).toEqual(exact(37));
    expect(matchInput('  rubidium ')).toEqual(exact(37));
    expect(matchInput('RUBIDIUM!')).toEqual(exact(37));
  });

  it('accepts symbols case-insensitively', () => {
    for (const s of ['cu', 'Cu', 'CU', 'cU']) expect(matchInput(s)).toEqual(exact(29));
    expect(matchInput('w')).toEqual(exact(74));
    expect(matchInput('Og')).toEqual(exact(118));
  });

  it('accepts spelling variants and historical names', () => {
    expect(matchInput('aluminium')).toEqual(exact(13));
    expect(matchInput('aluminum')).toEqual(exact(13));
    expect(matchInput('caesium')).toEqual(exact(55));
    expect(matchInput('cesium')).toEqual(exact(55));
    expect(matchInput('sulphur')).toEqual(exact(16));
    expect(matchInput('sulfur')).toEqual(exact(16));
    expect(matchInput('wolfram')).toEqual(exact(74));
    expect(matchInput('quicksilver')).toEqual(exact(80));
  });

  it('strips diacritics', () => {
    expect(matchInput('Cäsium')).toEqual({ kind: 'fuzzy', z: 55 });
    expect(matchInput('nèon')).toEqual(exact(10));
  });

  it('only accepts atomic numbers when the setting is on', () => {
    expect(matchInput('29')).toEqual({ kind: 'none' });
    expect(matchInput('29', { acceptAtomicNumbers: true })).toEqual(exact(29));
    expect(matchInput('0', { acceptAtomicNumbers: true })).toEqual({ kind: 'none' });
    expect(matchInput('119', { acceptAtomicNumbers: true })).toEqual({ kind: 'none' });
  });

  it('fixes unambiguous typos', () => {
    expect(matchInput('sodum')).toEqual({ kind: 'fuzzy', z: 11 });
    expect(matchInput('flourine')).toEqual({ kind: 'fuzzy', z: 9 });
    expect(matchInput('tungston')).toEqual({ kind: 'fuzzy', z: 74 });
    expect(matchInput('galium')).toEqual({ kind: 'fuzzy', z: 31 });
    expect(matchInput('rubidum')).toEqual({ kind: 'fuzzy', z: 37 });
  });

  it('never corrects one real element into another', () => {
    expect(matchInput('boron')).toEqual(exact(5));
    expect(matchInput('bromine')).toEqual(exact(35));
    expect(matchInput('cerium')).toEqual(exact(58));
    expect(matchInput('cesium')).toEqual(exact(55));
    expect(matchInput('tin')).toEqual(exact(50));
    expect(matchInput('iron')).toEqual(exact(26));
    expect(matchInput('argon')).toEqual(exact(18));
    expect(matchInput('xenon')).toEqual(exact(54));
  });

  it('asks for clarification when a typo is equally close to two elements', () => {
    // "ceium" is one letter from both cerium and cesium
    expect(matchInput('ceium')).toEqual({ kind: 'ambiguous', zs: [55, 58] });
  });

  it('does not fuzz short inputs or gibberish', () => {
    expect(matchInput('xx')).toEqual({ kind: 'none' });
    expect(matchInput('cuu')).toEqual({ kind: 'none' });
    expect(matchInput('banana')).toEqual({ kind: 'none' });
    expect(matchInput('')).toEqual({ kind: 'none' });
  });
});

describe('levenshtein', () => {
  it('computes edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('same', 'same')).toBe(0);
  });
});
