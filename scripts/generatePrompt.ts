/**
 * Evaluate scripts/promptDefs.ts into src/data/prompts.json (explicit, reviewable answer banks).
 *   npm run data:prompts          → write prompts.json and print every list + tier for review
 *   npm run data:check            → exit 1 if prompts.json is out of date with the defs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildPrompts } from './promptBuild';
import { tierTable, TIER_LABEL } from '../src/lib/scoring';
import { el } from '../src/lib/elements';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'src/data/prompts.json');

const prompts = buildPrompts();
const json = JSON.stringify(prompts, null, 1) + '\n';

if (process.argv.includes('--check')) {
  const current = readFileSync(outPath, 'utf8');
  if (current !== json) {
    console.error('prompts.json is out of date — run `npm run data:prompts` and review the diff.');
    process.exit(1);
  }
  console.log(`prompts.json is up to date (${prompts.length} prompts).`);
} else {
  writeFileSync(outPath, json);
  for (const p of prompts) {
    const table = tierTable(p);
    const parts = [...table.entries()].map(([z, t]) => `${el(z).symbol}:${TIER_LABEL[t]}`);
    console.log(`\n[${p.category} d${p.difficulty}] ${p.id} — ${p.text}`);
    console.log(`  ${parts.join('  ')}`);
  }
  const byCat: Record<string, number> = {};
  for (const p of prompts) byCat[p.category] = (byCat[p.category] ?? 0) + 1;
  console.log(`\nWrote ${prompts.length} prompts.`, byCat);
}
