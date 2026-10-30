import { useState } from 'react';
import { clearSave, freshSave, type Settings } from '../lib/storage';
import { useSave } from '../state/save';

type BoolKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

const TOGGLES: [BoolKey, string, string][] = [
  ['sound', 'Sound effects', 'Chiptune blips, synthesized in your browser'],
  ['scanlines', 'CRT scanlines', 'Faint horizontal lines over the screen'],
  ['colorblind', 'Colorblind glyphs', 'Adds a category symbol to element tiles'],
  ['showTimer', 'Show timer', 'Hide the fuse if it stresses you out (the clock still runs)'],
  ['acceptNumbers', 'Accept atomic numbers', 'Typing “29” counts as copper'],
];

export function SettingsPanel() {
  const { save, update, setSetting, reducedMotion } = useSave();
  const s = save.settings;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="settings">
      {TOGGLES.map(([key, label, hint]) => (
        <label key={key} className="toggle">
          <input type="checkbox" checked={s[key]} onChange={(e) => setSetting(key, e.target.checked)} />
          <span className="toggle-box" aria-hidden="true" />
          <span className="toggle-text">
            {label}
            <small>{hint}</small>
          </span>
        </label>
      ))}
      <label className="toggle">
        <input type="checkbox" checked={reducedMotion} onChange={(e) => setSetting('reduceMotion', e.target.checked)} />
        <span className="toggle-box" aria-hidden="true" />
        <span className="toggle-text">
          Reduce motion
          <small>{s.reduceMotion == null ? 'Following your system setting' : 'No parallax, camera cuts instead of scrolling'}</small>
        </span>
      </label>
      <div className="danger">
        {confirmReset ? (
          <>
            <span>Erase your streak, history and settings?</span>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                clearSave();
                update(() => freshSave());
                setConfirmReset(false);
              }}
            >
              YES, RESET
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              CANCEL
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
            RESET DATA…
          </button>
        )}
      </div>
    </div>
  );
}
