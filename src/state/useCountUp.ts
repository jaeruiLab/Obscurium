import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './save';

/**
 * Animates a displayed number toward `value` like a digital counter: eased, but updated in
 * coarse steps so it ticks rather than glides.
 */
export function useCountUp(value: number, ms = 900, stepMs = 45): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduced || shown === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      const eased = 1 - (1 - p) ** 3;
      const v = Math.round(start + (value - start) * eased);
      setShown(v);
      from.current = v;
      if (p >= 1) clearInterval(id);
    }, stepMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced, ms, stepMs]);

  return shown;
}
