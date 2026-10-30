import { useEffect, useRef, type Ref } from 'react';

export type MenuItem = 'how' | 'stats' | 'about' | 'privacy' | 'surface';

type Props = { inRun: boolean; onPick: (item: MenuItem) => void; onClose: () => void };

const SOON = ['Archive', 'Themed packs', 'Element codex'];

export function Menu({ inRun, onPick, onClose }: Props) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const item = (id: MenuItem, label: string, ref?: Ref<HTMLButtonElement>) => (
    <li>
      <button ref={ref} type="button" onClick={() => onPick(id)}>
        {label}
      </button>
    </li>
  );

  return (
    <div className="menu-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <nav className="menu panel" aria-label="Main menu">
        <ul>
          {item('how', 'How to play', first)}
          {item('stats', 'Stats')}
          {SOON.map((s) => (
            <li key={s}>
              <button type="button" disabled>
                {s} <i>SOON</i>
              </button>
            </li>
          ))}
          {item('about', 'About')}
          {item('privacy', 'Privacy')}
          {inRun && item('surface', '▲ Return to surface')}
        </ul>
        {inRun && <p className="menu-note">Leaving mid-prompt counts as a stalled drill.</p>}
      </nav>
    </div>
  );
}
