import { CATEGORY_LABEL, el, kToC } from './elements';
import type { Element, Prompt } from './types';

function fields(e: Element): Record<string, string | null> {
  const label = CATEGORY_LABEL[e.category];
  return {
    name: e.name,
    symbol: e.symbol,
    z: String(e.z),
    mass: String(e.mass),
    meltC: e.meltK == null ? null : kToC(e.meltK).toLocaleString('en-US'),
    boilC: e.boilK == null ? null : kToC(e.boilK).toLocaleString('en-US'),
    density: e.density == null ? null : String(e.density),
    group: e.group == null ? null : String(e.group),
    period: String(e.period),
    category: label,
    aCategory: e.category === 'unknown' ? null : `${/^[aeiou]/.test(label) ? 'an' : 'a'} ${label}`,
    phase: e.phaseSTP === 'unknown' ? null : e.phaseSTP,
    etym: e.etymology.detail,
    latin: e.latinSymbolOrigin ?? null,
    year: e.discoveryYear == null ? 'antiquity' : String(e.discoveryYear),
    discoverers: e.discoverers.length ? joinNames(e.discoverers) : null,
    stable: String(e.stableIsotopes),
    en: e.electronegativity == null ? null : String(e.electronegativity),
    ie: e.ionizationEnergy == null ? null : String(e.ionizationEnergy),
    config: e.electronConfiguration ? superscriptConfig(e.electronConfiguration) : null,
    block: e.block,
  };
}

const SUP: Record<string, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

/** "[Ar]3d5 4s1" → "[Ar]3d⁵ 4s¹" */
export function superscriptConfig(config: string): string {
  return config.replace(/([spdf])(\d+)/g, (_, l: string, n: string) => l + [...n].map((d) => SUP[d]).join(''));
}

function joinNames(names: string[]) {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Fill {placeholders} from element data. Returns null if any placeholder has no data. */
export function renderTemplate(template: string, e: Element): string | null {
  const f = fields(e);
  let missing = false;
  const out = template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = f[key];
    if (v == null) missing = true;
    return v ?? '';
  });
  return missing ? null : out;
}

export function edgeNote(prompt: Prompt, z: number): string | undefined {
  return prompt.edge?.find((x) => x.z === z)?.note;
}

/** One line explaining why an answer counts (valid or edge). */
export function validReason(prompt: Prompt, z: number): string {
  const e = el(z);
  const edge = edgeNote(prompt, z);
  if (edge) return `${e.name}: ${edge}`;
  return (
    prompt.reasons?.[z] ??
    (prompt.reasonTemplate && renderTemplate(prompt.reasonTemplate, e)) ??
    `${e.name} fits the prompt.`
  );
}

/** One line explaining why an answer doesn't count. */
export function invalidReason(prompt: Prompt, z: number): string {
  const e = el(z);
  return (
    prompt.invalidReasons?.[z] ??
    (prompt.invalidTemplate && renderTemplate(prompt.invalidTemplate, e)) ??
    `${e.name} doesn’t fit this prompt.`
  );
}
