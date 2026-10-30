/** Extra niche prompts that only appear in Challenge mode. */
import { ELEMENTS, el } from '../src/lib/elements';
import type { PromptDef } from './promptDefs';

/** Natural elements lighter than the element before them (the famous Ar/K, Co/Ni, Te/I flips). */
const inversions = ELEMENTS.filter((e) => e.z > 1 && e.z <= 93 && e.mass < el(e.z - 1).mass);

export const challengeDefs: PromptDef[] = [
  {
    id: 'mass-inversion',
    mode: 'challenge',
    category: 'PHYSICAL',
    difficulty: 3,
    text: 'Name an element with a smaller atomic mass than the element just before it',
    symbols: inversions.map((e) => e.symbol),
    edge: {
      Am: 'its mass is just its longest-lived isotope’s, so the comparison is a technicality',
      Bk: 'its mass is just its longest-lived isotope’s — and it beats curium by 0.00004 u',
    },
    mole: 'I',
    moleFact: 'Mendeleev put iodine after tellurium despite its lower mass — he trusted the chemistry over the arithmetic.',
    reasons: Object.fromEntries(
      inversions.map((e) => {
        const prev = el(e.z - 1);
        return [e.symbol, `${e.name} (${e.mass.toFixed(2)} u) is lighter than ${prev.name.toLowerCase()} (${prev.mass.toFixed(2)} u)`];
      }),
    ),
    invalidTemplate: '{name} is heavier than the element before it',
    packs: ['trends'],
  },
];
