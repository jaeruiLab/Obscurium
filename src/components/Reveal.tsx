import { useEffect, useRef } from 'react';
import { el } from '../lib/elements';
import { invalidReason, validReason } from '../lib/reasons';
import { METERS_PER_POINT } from '../lib/scoring';
import type { Answer, Prompt } from '../lib/types';
import { AnswerMap } from './AnswerMap';
import { ElementTile } from './ElementTile';
import { TierBadge } from './TierBadge';

type Props = {
  prompt: Prompt;
  answer: Answer;
  index: number;
  total: number;
  glyphs: boolean;
  onNext: () => void;
};

export function Reveal({ prompt, answer, index, total, glyphs, onNext }: Props) {
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => next.current?.focus({ preventScroll: true }), []);

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
    <section className="reveal panel" aria-labelledby="reveal-title">
      <div className="pc-head">
        <span className="tag">{prompt.category}</span>
        <span className="pc-count">
          PROMPT {index + 1} / {total}
        </span>
      </div>
      <p className="rv-prompt">{prompt.text}</p>

      <div className="rv-main">
        {answer.z != null ? <ElementTile z={answer.z} glyph={glyphs} /> : <div className="etile etile-lg etile-empty" aria-hidden="true">?</div>}
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

      <button ref={next} type="button" className="btn btn-primary" onClick={onNext}>
        <span className="arrow">▼</span> {last ? 'SEE YOUR CORE SAMPLE' : 'KEEP DIGGING'} <span className="arrow">▼</span>
      </button>

      <AnswerMap prompt={prompt} pickedZ={answer.z} />
    </section>
  );
}
