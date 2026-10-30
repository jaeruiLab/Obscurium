import { ELEMENTS } from './elements';
import type { Element } from './types';

/** Subshell → electron count, e.g. { '1s': 2, '2s': 2, '2p': 6 } */
export type Configuration = Record<string, number>;

const CAPACITY: Record<string, number> = { s: 2, p: 6, d: 10, f: 14 };
const L: Record<string, number> = { s: 0, p: 1, d: 2, f: 3 };

/** Subshells in Madelung (n + l, then n) filling order: 1s 2s 2p 3s 3p 4s 3d 4p … */
export const MADELUNG_ORDER: string[] = (() => {
  const shells: { name: string; n: number; l: number }[] = [];
  for (let n = 1; n <= 7; n++) {
    for (const t of ['s', 'p', 'd', 'f']) {
      const l = L[t];
      if (l < n) shells.push({ name: `${n}${t}`, n, l });
    }
  }
  return shells.sort((a, b) => a.n + a.l - (b.n + b.l) || a.n - b.n).map((s) => s.name);
})();

/** Ground state predicted by filling subshells strictly in Madelung order. */
export function madelungConfiguration(z: number): Configuration {
  const config: Configuration = {};
  let left = z;
  for (const shell of MADELUNG_ORDER) {
    if (left <= 0) break;
    const n = Math.min(left, CAPACITY[shell.slice(-1)]);
    config[shell] = n;
    left -= n;
  }
  return config;
}

const CORE: Record<string, number> = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };

/** Parse "[Ar]3d5 4s1" into a full subshell map (the noble-gas core expanded). */
export function parseConfiguration(text: string): Configuration {
  const core = text.match(/^\[(\w+)\]/);
  const config: Configuration = core ? madelungConfiguration(CORE[core[1]]) : {};
  const body = core ? text.slice(core[0].length) : text;
  for (const token of body.trim().split(/\s+/).filter(Boolean)) {
    const m = token.match(/^(\d)([spdf])(\d+)$/);
    if (!m) throw new Error(`Unparseable configuration token "${token}" in "${text}"`);
    config[`${m[1]}${m[2]}`] = Number(m[3]);
  }
  return config;
}

export function sameConfiguration(a: Configuration, b: Configuration): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if ((a[k] ?? 0) !== (b[k] ?? 0)) return false;
  return true;
}

/** True when the element's real ground state breaks the Aufbau (Madelung) filling order. */
export function isAufbauException(e: Element): boolean {
  return !sameConfiguration(parseConfiguration(e.electronConfiguration), madelungConfiguration(e.z));
}

/** Electrons in the highest-n shell (s + p) — the main-group "valence electrons". */
export function outerShellElectrons(e: Element): number {
  const config = parseConfiguration(e.electronConfiguration);
  const n = Math.max(...Object.keys(config).map((k) => Number(k[0])));
  return (config[`${n}s`] ?? 0) + (config[`${n}p`] ?? 0);
}

export const AUFBAU_EXCEPTIONS = () => ELEMENTS.filter((e) => e.z <= 103 && isAufbauException(e)).map((e) => e.symbol);
