import { formatDigNumber } from './daily';
import { MISS_EMOJI, METERS_PER_POINT, TIER_EMOJI } from './scoring';
import type { Answer } from './types';

export type ShareInput = {
  /** daily dig number, or null for a themed pack run */
  digNumber: number | null;
  packLabel?: string;
  answers: Answer[];
  points: number;
};

/** Spoiler-free result: tier squares only, never element names or symbols. */
export function shareText({ digNumber, packLabel, answers, points }: ShareInput): string {
  const title = digNumber != null ? `OBSCURIUM ${formatDigNumber(digNumber)}` : `OBSCURIUM · ${packLabel ?? 'PACK'}`;
  const depth = (points * METERS_PER_POINT).toLocaleString('en-US');
  const head = `${title} ⛏ ${points} pts · -${depth} m`;
  const squares = answers.map((a) => (a.tier ? TIER_EMOJI[a.tier] : MISS_EMOJI)).join('');
  return `${head}\n${squares}`;
}

/** Copy text to the clipboard with a textarea fallback. Resolves true on success. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
