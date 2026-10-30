import { useEffect, useRef, useState } from 'react';
import { formatDigNumber, msUntilNextDig } from '../lib/daily';
import { el } from '../lib/elements';
import { METERS_PER_POINT } from '../lib/scoring';
import { copyText, shareText } from '../lib/share';
import { stratumHeadline } from '../lib/strata';
import type { Answer, Prompt } from '../lib/types';
import { totalPoints } from '../state/gameReducer';
import { useNow } from '../state/useTimer';
import { AnswerMap } from './AnswerMap';
import { PixelDissolve } from './PixelDissolve';
import { StatsSummary } from './StatsPanel';
import { TierBadge } from './TierBadge';

type Props = {
  prompts: Prompt[];
  answers: Answer[];
  digNumber: number | null;
  packLabel?: string;
  challenge?: boolean;
  showStats: boolean;
  onClose: () => void;
};

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

export function Results({ prompts, answers, digNumber, packLabel, challenge, showStats, onClose }: Props) {
  const points = totalPoints(answers);
  const depth = points * METERS_PER_POINT;
  const [copied, setCopied] = useState<null | boolean>(null);
  const [open, setOpen] = useState<number | null>(null);
  const now = useNow(true, 1000);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);

  const share = async () => {
    const ok = await copyText(shareText({ digNumber, packLabel, challenge, answers, points }));
    setCopied(ok);
    setTimeout(() => setCopied(null), 2200);
  };

  return (
    <section className="results panel" aria-labelledby="results-title">
      <PixelDissolve block={16} duration={520} pattern="diagonal" />
      <p className="tag">{digNumber != null ? `${challenge ? 'CHALLENGE' : 'DIG'} ${formatDigNumber(digNumber)}` : packLabel}</p>
      <h2 id="results-title" ref={heading} tabIndex={-1} className="rs-title">
        {stratumHeadline(depth)}
      </h2>
      <div className="rs-numbers">
        <div>
          <span className="rs-label">DEPTH</span>
          <b className="copper">{depth === 0 ? '0' : `-${depth.toLocaleString('en-US')}`} m</b>
        </div>
        <div>
          <span className="rs-label">POINTS</span>
          <b className="sodium">{points}</b>
        </div>
      </div>

      <div className="rs-share">
        <button type="button" className="btn btn-primary" onClick={share}>
          <span className="arrow">▲</span> SHARE CORE SAMPLE <span className="arrow">▲</span>
        </button>
        <span className="rs-copied" aria-live="polite">
          {copied === true ? 'Copied — no spoilers inside.' : copied === false ? 'Couldn’t copy — select the text below.' : ''}
        </span>
        {copied === false && <pre className="rs-sharetext">{shareText({ digNumber, packLabel, challenge, answers, points })}</pre>}
      </div>

      <ol className="recap">
        {prompts.map((p, i) => {
          const a = answers[i];
          if (!a) return null;
          const mole = el(p.moleZ);
          return (
            <li key={p.id} className={open === i ? 'open' : ''} style={{ ['--i' as string]: i }}>
              <button type="button" className="recap-row" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span className="recap-n">{i + 1}</span>
                <span className="recap-text">{p.text}</span>
                <span className="recap-ans">
                  {a.z != null ? <b>{el(a.z).symbol}</b> : <b>—</b>}
                  <TierBadge tier={a.tier} miss={a.z == null ? 'timeout' : 'invalid'} small />
                </span>
                <span className="recap-mole">
                  ⚛ {mole.symbol}
                </span>
              </button>
              {open === i && <AnswerMap prompt={p} pickedZ={a.z} />}
            </li>
          );
        })}
      </ol>

      {showStats && <StatsSummary />}

      {digNumber != null && (
        <p className="rs-next">
          NEXT DIG IN <b>{formatCountdown(msUntilNextDig(new Date(now)))}</b>
        </p>
      )}
      <button type="button" className="btn btn-ghost" onClick={onClose}>
        ▲ BACK TO THE SURFACE
      </button>
    </section>
  );
}
