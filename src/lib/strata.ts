export type Stratum = { name: string; from: number; to: number };

/** Depth bands in meters. A perfect 700-point game reaches exactly 7,000 m. */
export const STRATA: Stratum[] = [
  { name: 'Topsoil', from: 0, to: 500 },
  { name: 'Sedimentary', from: 500, to: 2000 },
  { name: 'Granite', from: 2000, to: 4500 },
  { name: 'Basalt', from: 4500, to: 7000 },
  { name: 'The Moho', from: 7000, to: Infinity },
];

export const MOHO_DEPTH = 7000;

export function stratumFor(depthM: number): Stratum {
  return STRATA.find((s) => depthM >= s.from && depthM < s.to) ?? STRATA[STRATA.length - 1];
}

export function stratumHeadline(depthM: number): string {
  return depthM >= MOHO_DEPTH ? 'You hit the Moho!' : `You reached the ${stratumFor(depthM).name}`;
}
