import { ELEMENTS, bySym } from '../src/lib/elements';
import type { Prompt } from '../src/lib/types';
import { promptDefs } from './promptDefs';

function z(sym: string, ctx: string): number {
  const e = bySym(sym);
  if (!e || e.symbol !== sym) throw new Error(`${ctx}: unknown symbol "${sym}"`);
  return e.z;
}

function bySymbolKeys<T>(rec: Record<string, T> | undefined, ctx: string): Record<number, T> | undefined {
  if (!rec) return undefined;
  return Object.fromEntries(Object.entries(rec).map(([s, v]) => [z(s, ctx), v]));
}

/** Pure: defs + elements.json → Prompt[] (validated). */
export function buildPrompts(): Prompt[] {
  const ids = new Set<string>();
  return promptDefs.map((d) => {
    if (ids.has(d.id)) throw new Error(`Duplicate prompt id ${d.id}`);
    ids.add(d.id);
    if (!d.where === !d.symbols) throw new Error(`${d.id}: give exactly one of where / symbols`);

    const exclude = new Set((d.exclude ?? []).map((s) => z(s, d.id)));
    const validZ = (d.where
      ? ELEMENTS.filter(d.where).map((e) => e.z)
      : d.symbols!.map((s) => z(s, d.id))
    )
      .filter((v) => !exclude.has(v))
      .sort((a, b) => a - b);

    if (new Set(validZ).size !== validZ.length) throw new Error(`${d.id}: duplicate answers`);
    const edge = Object.entries(d.edge ?? {}).map(([s, note]) => ({ z: z(s, d.id), note }));
    for (const x of edge) {
      if (validZ.includes(x.z)) throw new Error(`${d.id}: edge element Z=${x.z} is also in validZ`);
    }
    const moleZ = z(d.mole, d.id);
    if (!validZ.includes(moleZ)) throw new Error(`${d.id}: mole ${d.mole} is not a valid answer`);
    const overrides = bySymbolKeys(d.overrides, d.id);
    for (const k of Object.keys(overrides ?? {})) {
      if (!validZ.includes(Number(k))) throw new Error(`${d.id}: override for non-valid Z=${k}`);
    }

    const p: Prompt = {
      id: d.id,
      mode: d.mode,
      category: d.category,
      difficulty: d.difficulty,
      text: d.text,
      validZ,
      ...(edge.length ? { edge } : {}),
      ...(overrides ? { overrides } : {}),
      moleZ,
      moleFact: d.moleFact,
      ...(d.reasonTemplate ? { reasonTemplate: d.reasonTemplate } : {}),
      ...(d.invalidTemplate ? { invalidTemplate: d.invalidTemplate } : {}),
      ...(d.reasons ? { reasons: bySymbolKeys(d.reasons, d.id) } : {}),
      ...(d.invalidReasons ? { invalidReasons: bySymbolKeys(d.invalidReasons, d.id) } : {}),
      packs: d.packs,
    };
    return p;
  });
}
