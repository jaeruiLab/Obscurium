import elementsData from '../data/elements.json';
import familiarityData from '../data/familiarity.json';
import type { Category, Element } from './types';

export const ELEMENTS = elementsData as Element[];

const byZ = new Map<number, Element>(ELEMENTS.map((e) => [e.z, e]));
const bySymbol = new Map<string, Element>(ELEMENTS.map((e) => [e.symbol.toLowerCase(), e]));

export function el(z: number): Element {
  const e = byZ.get(z);
  if (!e) throw new Error(`Unknown element Z=${z}`);
  return e;
}

export function bySym(symbol: string): Element | undefined {
  return bySymbol.get(symbol.toLowerCase());
}

const FAMILIARITY = familiarityData as Record<string, number>;

export function familiarity(z: number): number {
  return FAMILIARITY[el(z).symbol] ?? 1;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  alkali: 'alkali metal',
  'alkaline-earth': 'alkaline earth metal',
  transition: 'transition metal',
  'post-transition': 'post-transition metal',
  metalloid: 'metalloid',
  nonmetal: 'reactive nonmetal',
  halogen: 'halogen',
  'noble-gas': 'noble gas',
  lanthanide: 'lanthanide',
  actinide: 'actinide',
  unknown: 'superheavy element (properties unknown)',
};

/** Small glyph per category so color is never the only signal (colorblind mode). */
export const CATEGORY_GLYPH: Record<Category, string> = {
  alkali: '▲',
  'alkaline-earth': '△',
  transition: '◆',
  'post-transition': '◇',
  metalloid: '◐',
  nonmetal: '●',
  halogen: '✚',
  'noble-gas': '○',
  lanthanide: '■',
  actinide: '□',
  unknown: '?',
};

export const kToC = (k: number) => Math.round((k - 273.15) * 10) / 10;
