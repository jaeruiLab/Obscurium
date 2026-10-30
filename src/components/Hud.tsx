import { el } from '../lib/elements';
import { METERS_PER_POINT } from '../lib/scoring';
import type { Answer } from '../lib/types';
import { useCountUp } from '../state/useCountUp';

type Props = { answers: Answer[]; total: number; current: number; points: number };

/** Rig-LCD readouts plus seven specimen slots that fill with each dug element. */
export function Hud({ answers, total, current, points }: Props) {
  const depth = useCountUp(points * METERS_PER_POINT, 1100);
  const shownPoints = useCountUp(points, 1100);
  return (
    <header className="hud">
      <div className="lcd" aria-label={`Depth ${points * METERS_PER_POINT} meters`}>
        <span className="lcd-label">DEPTH</span>
        <span className="lcd-value copper">
          <i aria-hidden="true">-8,888m</i>
          <b>{depth === 0 ? '0' : `-${depth.toLocaleString('en-US')}`}m</b>
        </span>
      </div>
      <ol className="slots" aria-label={`Prompt ${Math.min(current + 1, total)} of ${total}`}>
        {Array.from({ length: total }, (_, i) => {
          const a = answers[i];
          const state = a ? (a.tier ? `filled t-${a.tier}` : 'missed') : i === current ? 'current' : '';
          return (
            <li key={i} className={`slot ${state}`}>
              {a?.tier && a.z != null ? el(a.z).symbol : a ? '×' : i + 1}
            </li>
          );
        })}
      </ol>
      <div className="lcd" aria-label={`Score ${points}`}>
        <span className="lcd-label">SCORE</span>
        <span className="lcd-value sodium">
          <i aria-hidden="true">888</i>
          <b>{shownPoints}</b>
        </span>
      </div>
    </header>
  );
}
