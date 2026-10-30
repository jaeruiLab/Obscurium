import { SECONDS_PER_PROMPT } from '../lib/daily';
import type { Prompt } from '../lib/types';
import { useNow } from '../state/useTimer';
import { PixelDissolve } from './PixelDissolve';
import { TypeInput } from './TypeInput';

type Props = {
  prompt: Prompt;
  index: number;
  total: number;
  phase: 'intro' | 'prompt';
  phaseStartedAt: number;
  introMs: number;
  showTimer: boolean;
  acceptNumbers: boolean;
  onSubmit: (z: number) => void;
  onMiss: () => void;
};

const SEGMENTS = SECONDS_PER_PROMPT;

/** Segmented "fuse" that burns down over 25 s and turns lithium-red for the last 5. */
function Fuse({ remainingMs }: { remainingMs: number }) {
  const secs = remainingMs / 1000;
  const warn = secs <= 5;
  return (
    <div className={`fuse${warn ? ' warn' : ''}`} role="timer" aria-label={`${Math.ceil(secs)} seconds left`}>
      <div className="fuse-track" aria-hidden="true">
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const fill = Math.max(0, Math.min(1, secs - i));
          return (
            <span key={i} className={`fuse-seg${fill >= 1 ? ' on' : ''}`}>
              {fill > 0 && fill < 1 && <i style={{ width: `${fill * 100}%` }} />}
            </span>
          );
        })}
      </div>
      <span className="fuse-num">{Math.ceil(secs)}s</span>
    </div>
  );
}

export function PromptCard(props: Props) {
  const { prompt, index, total, phase, phaseStartedAt, introMs, showTimer } = props;
  const now = useNow(true, 100);
  const live = phase === 'prompt';
  const remaining = live ? Math.max(0, phaseStartedAt + SECONDS_PER_PROMPT * 1000 - now) : SECONDS_PER_PROMPT * 1000;
  const countdown = Math.max(1, Math.ceil((phaseStartedAt + introMs - now) / 1000));

  return (
    <section className="prompt-card panel" aria-labelledby="prompt-text">
      <PixelDissolve block={14} duration={360} />
      <div className="pc-head">
        <span className="tag">{prompt.category}</span>
        <span className="pc-count">
          PROMPT {index + 1} / {total}
        </span>
      </div>
      <h2 id="prompt-text" className="pc-text">
        {prompt.text}
      </h2>
      <p className="pc-sub">▼ rarer elements dig deeper ▼</p>

      {phase === 'intro' ? (
        <p className="pc-countdown" aria-live="polite">
          drilling · the clock starts in <b>{countdown}</b>
        </p>
      ) : (
        <div className="pc-live">
          <PixelDissolve block={8} duration={260} pattern="dither" accent={null} />
          {showTimer ? <Fuse remainingMs={remaining} /> : <div className="fuse-hidden" role="timer" aria-label={`${Math.ceil(remaining / 1000)} seconds left`} />}
          <TypeInput key={prompt.id} onSubmit={props.onSubmit} onMiss={props.onMiss} acceptNumbers={props.acceptNumbers} autoFocus disabled={!live} />
        </div>
      )}
    </section>
  );
}
