import { computeStats } from '../lib/stats';
import { liveStreak } from '../lib/storage';
import { dateKeyFor, formatDigNumber } from '../lib/daily';
import { TIER_LABEL, TIER_ORDER } from '../lib/scoring';
import { useSave } from '../state/save';

export function StatsSummary() {
  const { save } = useSave();
  const s = computeStats(save.history);
  const streak = liveStreak(save.streak, dateKeyFor(new Date()));
  const maxTier = Math.max(1, ...Object.values(s.tiers));
  const rows = [...TIER_ORDER, 'miss' as const];
  return (
    <div className="stats">
      <dl className="stats-grid">
        <div>
          <dt>DIGS</dt>
          <dd>{s.played}</dd>
        </div>
        <div>
          <dt>STREAK</dt>
          <dd>{streak}</dd>
        </div>
        <div>
          <dt>BEST STREAK</dt>
          <dd>{save.streak.best}</dd>
        </div>
        <div>
          <dt>AVG DEPTH</dt>
          <dd>{s.avgDepth ? `-${s.avgDepth.toLocaleString('en-US')} m` : '—'}</dd>
        </div>
        <div>
          <dt>BEST DIG</dt>
          <dd>{s.bestDig ? `-${s.bestDepth.toLocaleString('en-US')} m (${formatDigNumber(s.bestDig)})` : '—'}</dd>
        </div>
      </dl>
      <h3 className="stats-h">TIER HISTOGRAM</h3>
      <ul className="histogram">
        {rows.map((t) => (
          <li key={t}>
            <span className="hist-label">{t === 'miss' ? 'Miss' : TIER_LABEL[t]}</span>
            <span className="hist-bar">
              <i className={t === 'miss' ? 't-miss' : `t-${t}`} style={{ width: `${(s.tiers[t] / maxTier) * 100}%` }} />
            </span>
            <span className="hist-n">{s.tiers[t]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
