import { TIER_LABEL, TIER_POINTS } from '../lib/scoring';
import type { Tier } from '../lib/types';

export function TierBadge({ tier, miss, small = false }: { tier: Tier | null; miss?: 'invalid' | 'timeout'; small?: boolean }) {
  if (!tier) {
    return (
      <span className={`tier-badge tier-miss${small ? ' small' : ''}`}>
        {miss === 'timeout' ? 'STALLED' : 'NO STRIKE'}
        {!small && <b>+0</b>}
      </span>
    );
  }
  return (
    <span className={`tier-badge tier-${tier}${small ? ' small' : ''}`}>
      {TIER_LABEL[tier]}
      {!small && <b>+{TIER_POINTS[tier]}</b>}
    </span>
  );
}
