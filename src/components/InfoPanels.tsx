import { TIER_LABEL, TIER_ORDER, TIER_POINTS } from '../lib/scoring';
import { SECONDS_PER_PROMPT, PROMPTS_PER_RUN } from '../lib/daily';

export function HowToPlay() {
  return (
    <div className="howto">
      <ol>
        <li>
          Every day there are <b>{PROMPTS_PER_RUN} prompts</b> like “Name an element named after a place.” Everyone gets the same ones.
        </li>
        <li>
          You have <b>{SECONDS_PER_PROMPT} seconds</b> to type one element — its name or its symbol. It’s all recall: no lists, no table to pick from.
        </li>
        <li>
          Any valid element scores, but <b>rarer answers score more</b>. Each point drills <b>10 m</b> deeper. A perfect dig hits the Moho at 7,000 m.
        </li>
        <li>
          After each answer, the periodic table lights up every element that would have counted.
        </li>
        <li>
          Want it harder? <b>Challenge</b> is a second daily set of niche prompts: etymology, history and nuclear trivia. It doesn’t touch your streak.
        </li>
      </ol>
      <ul className="howto-tiers">
        {TIER_ORDER.map((t) => (
          <li key={t}>
            <span className={`tier-badge tier-${t} small`}>{TIER_LABEL[t]}</span> {TIER_POINTS[t]} pts
          </li>
        ))}
      </ul>
      <p className="howto-note">⏱ The clock keeps running if you switch tabs or reload — a reload counts as a stalled drill.</p>
    </div>
  );
}

export function About() {
  return (
    <div className="prose">
      <p>
        <b>OBSCURIUM</b> is a daily trivia dig through the periodic table. Rarer elements drill deeper into a pixel-art cross-section of the Earth.
      </p>
      <p>
        Rarity is predicted from how familiar each element is to a typical student, with hand-tuned overrides. The “One in a Mole” answer for each prompt is hand-picked: it’s the satisfying rare answer, not just the most obscure one. (A mole is about 6.022 × 10²³ — and yes, the mascot is a mole.)
      </p>
      <p>
        Element data starts from the{' '}
        <a href="https://pubchem.ncbi.nlm.nih.gov/periodic-table/" target="_blank" rel="noreferrer">
          PubChem periodic table
        </a>{' '}
        (NCBI), with every field a prompt depends on checked by hand. Found a classification you disagree with? That’s chemistry — the edge cases score as “Technically Correct.”
      </p>
      <p className="muted">The UI palette comes from flame tests: copper burns green, potassium lilac, sodium amber and lithium red.</p>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="prose">
      <p>OBSCURIUM has no accounts, no ads and no tracking.</p>
      <p>
        Your streak, history and settings are saved only in this browser’s local storage. Clearing site data, or using <b>Settings → Reset data</b>, erases them.
      </p>
      <p>Fonts load from Google Fonts. Nothing else leaves your device.</p>
    </div>
  );
}

export function Skins() {
  const skins = [
    ['Hard hat', 'Unlocked'],
    ['Lab coat', 'Reach a 3-day streak'],
    ['Safety goggles', 'Reach a 7-day streak'],
    ['Gold helmet', 'Hit the Moho'],
    ['Radioactive glow', 'Finish the Half-Life Halloween pack'],
  ];
  return (
    <div className="prose">
      <p>Mole skins are coming soon. Here’s what you’ll be able to unlock:</p>
      <ul className="skins">
        {skins.map(([name, how]) => (
          <li key={name}>
            <b>{name}</b> <span className="muted">— {how}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
