import { useEffect, useRef, useState, type FormEvent } from 'react';
import { el } from '../lib/elements';
import { matchInput } from '../lib/match';

type Props = {
  onSubmit: (z: number) => void;
  onMiss?: () => void;
  acceptNumbers: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

/** Monospace recall input with a blinking block cursor. No autocomplete — recall is the point. */
export function TypeInput({ onSubmit, onMiss, acceptNumbers, disabled, autoFocus }: Props) {
  const [value, setValue] = useState('');
  const [caret, setCaret] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [shake, setShake] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled) {
      input.current?.focus({ preventScroll: true });
      // keep the input above an on-screen keyboard
      setTimeout(() => input.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    }
  }, [autoFocus, disabled]);

  const syncCaret = () => setCaret(input.current?.selectionStart ?? value.length);

  const submit = (ev?: FormEvent) => {
    ev?.preventDefault();
    if (disabled || !value.trim()) return;
    const m = matchInput(value, { acceptAtomicNumbers: acceptNumbers });
    if (m.kind === 'exact' || m.kind === 'fuzzy') {
      setChoices([]);
      setMessage(null);
      onSubmit(m.z);
    } else if (m.kind === 'ambiguous') {
      setChoices(m.zs);
      setMessage('Did you mean…');
    } else {
      setChoices([]);
      setMessage('Not an element — try again');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      onMiss?.();
    }
  };

  return (
    <form className="type-input" onSubmit={submit}>
      <div className={`ti-field${shake ? ' shake' : ''}`}>
        <span className="ti-prompt" aria-hidden="true">&gt;</span>
        <div className="ti-box">
          <input
            ref={input}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              setValue(e.target.value);
              setCaret(e.target.selectionStart ?? e.target.value.length);
              setMessage(null);
              setChoices([]);
            }}
            onKeyUp={syncCaret}
            onClick={syncCaret}
            onSelect={syncCaret}
            aria-label="Type an element name or symbol"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            maxLength={24}
            placeholder="element or symbol"
          />
          <span className="ti-mirror" aria-hidden="true">
            {value.slice(0, caret)}
            <span className="ti-cursor">{value[caret] ?? ' '}</span>
          </span>
        </div>
        <button type="submit" className="btn btn-dig" disabled={disabled || !value.trim()}>
          ▼ DIG ▼
        </button>
      </div>
      <div className="ti-feedback" aria-live="polite">
        {message && <span className="ti-msg">{message}</span>}
        {!message && !value && <span className="ti-hint">type an element name or symbol · enter digs</span>}
        {choices.map((z) => (
          <button key={z} type="button" className="chip chip-choice" onClick={() => onSubmit(z)}>
            {el(z).name}
          </button>
        ))}
      </div>
    </form>
  );
}
