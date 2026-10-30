import { useState } from 'react';
import { formatDigNumber, msUntilNextDig } from '../lib/daily';
import { useNow } from '../state/useTimer';
import { HowToPlay } from './InfoPanels';
import { formatCountdown } from './Results';

type Props = {
  digNumber: number;
  streak: number;
  doneToday: boolean;
  resumable: boolean;
  onBegin: () => void;
  onViewToday: () => void;
  onEvent: () => void;
  onPrivacy: () => void;
};

export function Wordmark() {
  return (
    <h1 className="wordmark" data-text="OBSCURIUM">
      OBSCURIUM
    </h1>
  );
}

export function TitleScreen({ digNumber, streak, doneToday, resumable, onBegin, onViewToday, onEvent, onPrivacy }: Props) {
  const [howOpen, setHowOpen] = useState(false);
  const now = useNow(doneToday, 1000);

  return (
    <main className="title-screen">
      <div className="title-block">
        <Wordmark />
        <p className="subtitle">THE DAILY DIG</p>
        <p className="tagline">7 prompts · 25 seconds each · rarer elements dig deeper</p>
      </div>

      <div className="title-column">
        <button type="button" className="howto-toggle" aria-expanded={howOpen} onClick={() => setHowOpen(!howOpen)}>
          {howOpen ? '▼' : '►'} HOW TO PLAY
        </button>
        {howOpen && (
          <div className="howto-inline panel">
            <HowToPlay />
          </div>
        )}
        <button type="button" className="privacy-link" onClick={onPrivacy}>
          Privacy
        </button>

        <button type="button" className="event-card" onClick={onEvent}>
          <span className="event-tab">BETA · LIMITED TIME</span>
          <span className="event-icon" aria-hidden="true">☢</span>
          <span className="event-name">HALF-LIFE HALLOWEEN</span>
          <span className="event-desc">7 radioactive prompts · doesn’t touch your streak</span>
        </button>

        {doneToday ? (
          <button type="button" className="btn btn-cta" onClick={onViewToday}>
            <span className="arrow">▲</span> VIEW TODAY’S DIG <span className="arrow">▲</span>
          </button>
        ) : (
          <button type="button" className="btn btn-cta" onClick={onBegin}>
            <span className="arrow">▼</span> {resumable ? 'RESUME DIG' : 'BEGIN DIG'} <span className="arrow">▼</span>
          </button>
        )}

        <div className="title-footer">
          <span className="footer-meta">
            DIG {formatDigNumber(digNumber)} · STREAK {streak}
            {doneToday && <> · NEXT IN {formatCountdown(msUntilNextDig(new Date(now)))}</>}
          </span>
          <span className="footer-chips">
            <span className="chip disabled" aria-disabled="true">
              ARCHIVE ↺<i>SOON</i>
            </span>
            <span className="chip disabled" aria-disabled="true">
              THEMED PACKS<i>SOON</i>
            </span>
            <span className="chip disabled" aria-disabled="true">
              UNLIMITED ∞<i>SOON</i>
            </span>
          </span>
        </div>
      </div>
    </main>
  );
}
