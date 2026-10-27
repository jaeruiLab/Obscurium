import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadSave, writeSave, type SaveData, type Settings } from '../lib/storage';
import { setSoundEnabled } from '../audio/sfx';

type SaveApi = {
  save: SaveData;
  update: (fn: (s: SaveData) => SaveData) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  /** effective reduced-motion: explicit setting, else the OS preference */
  reducedMotion: boolean;
};

const SaveCtx = createContext<SaveApi | null>(null);

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [pref, setPref] = useState(() => typeof matchMedia === 'function' && matchMedia(query).matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia(query);
    const on = () => setPref(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return pref;
}

export function SaveProvider({ children, initial }: { children: ReactNode; initial?: SaveData }) {
  const [save, setSave] = useState<SaveData>(() => initial ?? loadSave());
  const osReduced = usePrefersReducedMotion();

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    setSave((prev) => {
      const next = fn(prev);
      if (next !== prev) writeSave(next);
      return next;
    });
  }, []);

  const setSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => update((s) => ({ ...s, settings: { ...s.settings, [key]: value } })),
    [update],
  );

  useEffect(() => setSoundEnabled(save.settings.sound), [save.settings.sound]);

  const reducedMotion = save.settings.reduceMotion ?? osReduced;
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [reducedMotion]);

  const api = useMemo(() => ({ save, update, setSetting, reducedMotion }), [save, update, setSetting, reducedMotion]);
  return <SaveCtx.Provider value={api}>{children}</SaveCtx.Provider>;
}

export function useSave(): SaveApi {
  const api = useContext(SaveCtx);
  if (!api) throw new Error('useSave outside SaveProvider');
  return api;
}
