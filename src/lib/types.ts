export type Block = 's' | 'p' | 'd' | 'f';

export type Category =
  | 'alkali'
  | 'alkaline-earth'
  | 'transition'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'
  | 'unknown';

export type Phase = 'solid' | 'liquid' | 'gas' | 'unknown';

export type EtymologyType =
  | 'person'
  | 'place'
  | 'celestial'
  | 'myth'
  | 'color'
  | 'property'
  | 'mineral'
  | 'other';

export type Element = {
  z: number;
  symbol: string;
  name: string;
  altNames: string[];
  /** 1–7 main table, 9–10 detached f-block rows */
  gridRow: number;
  gridCol: number;
  mass: number;
  group: number | null;
  period: number;
  block: Block;
  category: Category;
  phaseSTP: Phase;
  meltK: number | null;
  boilK: number | null;
  density: number | null;
  electronegativity: number | null;
  /** first ionization energy, eV */
  ionizationEnergy: number | null;
  /** ground-state configuration, e.g. "[Ar]3d5 4s1" (superheavies are predictions) */
  electronConfiguration: string;
  radioactive: boolean;
  stableIsotopes: number;
  occurrence: 'primordial' | 'from-decay' | 'synthetic';
  discoveryYear: number | null;
  discoverers: string[];
  etymology: { type: EtymologyType; detail: string };
  latinSymbolOrigin?: string;
  crustalAbundancePpm: number | null;
  funFact: string;
};

export type Tier = 'bedrock' | 'ore' | 'vein' | 'trace' | 'rare' | 'mole' | 'technical';

export type PromptCategory =
  | 'PERIODIC TABLE'
  | 'TRENDS'
  | 'PHYSICAL'
  | 'CHEMICAL'
  | 'ELECTRONS'
  | 'SYMBOLS'
  | 'ETYMOLOGY'
  | 'NUCLEAR'
  | 'HISTORY';

/** daily = broad gen-chem prompts; challenge = the niche ones */
export type PromptMode = 'daily' | 'challenge';

export type Prompt = {
  id: string;
  mode: PromptMode;
  category: PromptCategory;
  difficulty: 1 | 2 | 3;
  text: string;
  validZ: number[];
  edge?: { z: number; note: string }[];
  overrides?: Record<number, Tier>;
  moleZ: number;
  moleFact: string;
  /** Template for the "why it's valid" line, e.g. "{name} melts at {meltC} °C" */
  reasonTemplate?: string;
  /** Template for the "why not" line on an invalid answer */
  invalidTemplate?: string;
  reasons?: Record<number, string>;
  invalidReasons?: Record<number, string>;
  packs: string[];
};

export type AnswerVia = 'type' | 'timeout';

export type Answer = {
  promptId: string;
  z: number | null;
  via: AnswerVia;
  tier: Tier | null;
  points: number;
};
