import { useEffect, useRef, useState } from 'react';
import { el } from '../lib/elements';
import { invalidReason, validReason } from '../lib/reasons';
import { METERS_PER_POINT } from '../lib/scoring';
import type { Answer, Prompt } from '../lib/types';
import { AnswerMap } from './AnswerMap';
import { ElementTile } from './ElementTile';
import { PixelDissolve } from './PixelDissolve';
import { useReducedMotion } from '../state/save';
import { TierBadge } from './TierBadge';

type Props = {
  prompt: Prompt;
  answer: Answer;
  index: number;
  total: number;
  glyphs: boolean;
  /** the drill starts digging (called on click) */
  onLeave: () => void;
  /** the card has slid away; move on */
  onNext: () => void;
  /** ms from KEEP DIGGING to onNext */
  exitMs: number;
};

/** How long the reveal card takes to sink out of view. */
export const REVEAL_EXIT_MS = 320;

export function Reveal({ prompt, answer, index, total, glyphs, onLeave, onNext, exitMs }: Props) {
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => next.current?.focus({ preventScroll: true }), []);
  const reduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const keepDigging = () => {
    if (leaving) return;
    onLeave();
    if (reduced) {
      onNext();
      return;
    }
    setLeaving(true);
    timer.current = setTimeout(onNext, exitMs);
  };

  const mole = el(prompt.moleZ);
  const isMole = answer.z === prompt.moleZ;
  const last = index >= total - 1;
  const line =
    answer.z == null
      ? 'Drill stalled — the clock ran out.'
      : answer.tier
        ? validReason(prompt, answer.z)
        : invalidReason(prompt, answer.z);

  return (
    <section className={`reveal panel${leaving ? ' leaving' : ''}`} aria-labelledby="reveal-title">
      <PixelDissolve block={14} duration={380} />
      <div className="pc-head">
        <span className="tag">{prompt.category}</span>
        <span className="pc-count">
          PROMPT {index + 1} / {total}
        </span>
      </div>
      <p className="rv-prompt">{prompt.text}</p>

      <div className={`rv-main${answer.tier ? '' : ' bad'}`}>
        {answer.z != null ? <ElementTile z={answer.z} glyph={glyphs} materialize /> : <div className="etile etile-lg etile-empty" aria-hidden="true">?</div>}
        <div className="rv-result">
          <h2 id="reveal-title" className="sr-only">
            {answer.z != null ? el(answer.z).name : 'Timeout'}
          </h2>
          <TierBadge tier={answer.tier} miss={answer.z == null ? 'timeout' : 'invalid'} />
          <p className={`rv-depth${answer.points > 0 ? '' : ' none'}`}>
            {answer.points > 0 ? `▼ +${(answer.points * METERS_PER_POINT).toLocaleString('en-US')} m` : '▬ no progress'}
          </p>
          <p className={`rv-line${answer.tier ? '' : ' bad'}`}>{line}</p>
        </div>
      </div>

      <div className={`rv-mole${isMole ? ' hit' : ''}`}>
        <span className="rv-mole-label">⚛ ONE IN A MOLE</span>
        <span className="rv-mole-el">
          {mole.symbol} · {mole.name}
        </span>
        <p>{prompt.moleFact}</p>
      </div>

      <button ref={next} type="button" className="btn btn-primary" onClick={keepDigging} disabled={leaving}>
        <span className="arrow">▼</span> {last ? 'SEE YOUR CORE SAMPLE' : 'KEEP DIGGING'} <span className="arrow">▼</span>
      </button>

      <AnswerMap prompt={prompt} pickedZ={answer.z} />
    </section>
  );
}
