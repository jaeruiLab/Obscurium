/**
 * "Flame Test" palette — named after the colors elements burn in a flame test.
 * DOM equivalents live in src/styles/tokens.css (kept in sync by palette.test.ts).
 */
export const PALETTE = {
  copper: '#3fe0a0', // copper-flame green: borders, CTA, focus, title ghost ↖
  lilac: '#b48cff', // potassium lilac: selection, title ghost ↘
  sodium: '#ffb340', // sodium amber: pennant, headlamp, player's pick
  lithium: '#ff5a4a', // lithium red: timer warning
  panel: '#15171c', // graphite
  deep: '#08090b',
  body: '#ece4d6',
  muted: '#a39a8c',
  ink: '#5a4636', // text that sits directly on the sky
  copperInk: '#0b5a40', // copper text on the sky
  cream: '#fbf1df',
  skyTop: '#f2b48a',
  skyHorizon: '#fde6cc',
} as const;

export const TIER_COLOR = {
  bedrock: '#9c7b58',
  ore: '#e0843a',
  vein: '#e8c547',
  trace: '#d8dde3',
  rare: '#c77dff',
  mole: '#3fe0a0',
  technical: '#5aa9e6',
} as const;

export const CATEGORY_COLOR = {
  alkali: '#e8735a',
  'alkaline-earth': '#e8a35a',
  transition: '#7fa7c9',
  'post-transition': '#8fb59a',
  metalloid: '#c2b25c',
  nonmetal: '#5cc28a',
  halogen: '#5cc2c2',
  'noble-gas': '#b48cff',
  lanthanide: '#d98cbf',
  actinide: '#e07a9a',
  unknown: '#8a8f99',
} as const;
