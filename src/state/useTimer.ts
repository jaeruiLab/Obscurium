import { useEffect, useRef, useState } from 'react';

/** Wall-clock "now" that re-renders every `intervalMs` while active (hidden-tab time still counts). */
export function useNow(active: boolean, intervalMs = 100): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}

/** Fires `onExpire` once when `deadline` passes (checked against the wall clock). */
export function useDeadline(deadline: number | null, onExpire: () => void) {
  const cb = useRef(onExpire);
  cb.current = onExpire;
  useEffect(() => {
    if (deadline == null) return;
    let fired = false;
    const check = () => {
      if (!fired && Date.now() >= deadline) {
        fired = true;
        cb.current();
      }
    };
    const id = setInterval(check, 100);
    check();
    return () => clearInterval(id);
  }, [deadline]);
}
