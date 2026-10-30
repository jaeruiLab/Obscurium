import { useMemo, useState } from 'react';
import { ELEMENTS, el } from '../lib/elements';
import { edgeNote, validReason } from '../lib/reasons';
import { tierTable, TIER_LABEL, TIER_ORDER, TIER_POINTS } from '../lib/scoring';
import type { Element, Prompt } from '../lib/types';

/** Grid placement: detached f-block rows (9–10) sit under a small spacer row (row 8). */
const cellStyle = (e: Element) => ({ gridRow: e.gridRow, gridColumn: e.gridCol });

type Props = {
  prompt: Prompt;
  pickedZ: number | null;
  compact?: boolean;
};

/** The periodic table as the reveal: every valid element lit by tier, the pick and the Mole answer ringed. */
export function AnswerMap({ prompt, pickedZ, compact }: Props) {
  const table = useMemo(() => tierTable(prompt), [prompt]);
  const [info, setInfo] = useState<number | null>(null);
  const infoEl = info != null ? el(info) : null;
  const infoTier = info != null ? table.get(info) : undefined;

  return (
    <div className={`pt-wrap answer-map${compact ? ' compact' : ''}`}>
      <div className="pt-scroll">
        <div className="pt-grid" role="group" aria-label="Answer map">
          {ELEMENTS.map((e) => {
            const tier = table.get(e.z);
            const cls = [
              'pt-tile',
              tier ? `lit t-${tier}` : 'dim',
              edgeNote(prompt, e.z) ? 'edge' : '',
              e.z === pickedZ ? 'picked' : '',
              e.z === prompt.moleZ ? 'mole-ring' : '',
              e.z === info ? 'info' : '',
            ].join(' ');
            return (
              <button
                key={e.z}
                type="button"
                className={cls}
                style={{ ...cellStyle(e), ['--d' as string]: `${(e.gridRow + e.gridCol) * 14}ms` }}
                tabIndex={tier ? 0 : -1}
                aria-label={`${e.name}${tier ? `, ${TIER_LABEL[tier]}` : ', not valid'}${e.z === pickedZ ? ', your pick' : ''}`}
                onClick={() => tier && setInfo(e.z === info ? null : e.z)}
              >
                {!compact && <span className="pt-z">{e.z}</span>}
                <span className="pt-sym">{e.symbol}</span>
              </button>
            );
          })}
          <div className="pt-gap" style={{ gridRow: 6, gridColumn: 3 }} aria-hidden="true">57–71</div>
          <div className="pt-gap" style={{ gridRow: 7, gridColumn: 3 }} aria-hidden="true">89–103</div>
        </div>
      </div>
      {!compact && (
        <div className="am-foot">
          {infoEl && infoTier ? (
            <p className="am-info">
              <b>{infoEl.name}</b> · {TIER_LABEL[infoTier]} +{TIER_POINTS[infoTier]} — {validReason(prompt, infoEl.z)}
            </p>
          ) : (
            <p className="am-hint">Tap a lit tile to see why it counts.</p>
          )}
          <ul className="am-legend" aria-label="Legend">
            {TIER_ORDER.map((t) => (
              <li key={t}>
                <i className={`sw t-${t}`} aria-hidden="true" />
                {TIER_LABEL[t]}
              </li>
            ))}
            <li>
              <i className="sw ring-pick" aria-hidden="true" />
              Your pick
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
