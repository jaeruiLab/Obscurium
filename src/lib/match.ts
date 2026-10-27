import { ELEMENTS } from './elements';

export type MatchResult =
  | { kind: 'exact'; z: number }
  | { kind: 'fuzzy'; z: number }
  | { kind: 'ambiguous'; zs: number[] }
  | { kind: 'none' };

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const nameIndex = new Map<string, number>();
const symbolIndex = new Map<string, number>();
const fuzzyCandidates: { key: string; z: number }[] = [];

for (const e of ELEMENTS) {
  for (const n of [e.name, ...e.altNames]) {
    const key = normalize(n);
    nameIndex.set(key, e.z);
    // Latin symbol origins (kalium, natrium…) are exact-only, so "galium" can't tie gallium with kalium.
    if (n !== e.latinSymbolOrigin) fuzzyCandidates.push({ key, z: e.z });
  }
  symbolIndex.set(e.symbol.toLowerCase(), e.z);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Typo budget for a candidate name: short names get less slack. */
const maxDistance = (candidate: string) => (candidate.length <= 5 ? 1 : 2);

/**
 * Resolve typed input to an element.
 * Exact names/aliases/symbols always win, so a real element is never "corrected" into another
 * (boron stays boron, cerium stays cerium). Fuzzy matching only applies to inputs of 4+ letters
 * and only when one element is strictly closest; ties are reported as ambiguous.
 */
export function matchInput(raw: string, opts: { acceptAtomicNumbers?: boolean } = {}): MatchResult {
  const n = normalize(raw);
  if (!n) return { kind: 'none' };

  if (/^\d+$/.test(n)) {
    const z = Number(n);
    return opts.acceptAtomicNumbers && z >= 1 && z <= 118 ? { kind: 'exact', z } : { kind: 'none' };
  }

  const byName = nameIndex.get(n);
  if (byName) return { kind: 'exact', z: byName };
  const bySymbol = symbolIndex.get(n);
  if (bySymbol) return { kind: 'exact', z: bySymbol };

  if (n.length < 4 || /\d/.test(n)) return { kind: 'none' };

  const best = new Map<number, number>();
  for (const { key, z } of fuzzyCandidates) {
    const d = levenshtein(n, key);
    if (d <= maxDistance(key) && d < (best.get(z) ?? Infinity)) best.set(z, d);
  }
  if (!best.size) return { kind: 'none' };
  const min = Math.min(...best.values());
  const closest = [...best.entries()].filter(([, d]) => d === min).map(([z]) => z);
  return closest.length === 1 ? { kind: 'fuzzy', z: closest[0] } : { kind: 'ambiguous', zs: closest.sort((a, b) => a - b) };
}
