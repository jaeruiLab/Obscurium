# OBSCURIUM: The Daily Dig

A daily periodic-table trivia game. Each day everyone gets the same 7 prompts, like *"Name a transition metal"*. You have 25 seconds to type an element. Any valid answer scores, but rarer ones score more, and every point drills 10 m deeper into a pixel-art cross-section of the Earth. A perfect dig hits the Moho at 7,000 m.

## Modes

- **Daily Dig:** broad gen-chem / AP Chem prompts (groups, periodic trends, ions, electron configurations). It builds your streak.
- **Challenge:** a second daily set of niche prompts (etymology, discovery history, nuclear trivia). It doesn't affect your streak.
- **Half-Life Halloween:** a limited-time themed pack.

Answers are rated Bedrock → Ore → Vein → Trace → Rare Earth, plus a hand-picked **One in a Mole** answer worth 100 points and **Technically Correct** (15 points) for edge cases. After each answer, the periodic table lights up everything that would have counted.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest
npm run build    # production build in dist/
```

## Data

- `src/data/elements.json` is built from a PubChem snapshot plus hand-curated fields: `npm run data:elements`.
- `src/data/prompts.json` is generated from `scripts/promptDefs*.ts` into explicit, reviewable answer lists: `npm run data:prompts` (`npm run data:check` verifies it's up to date).

## Stack

Vite, React and TypeScript, with a canvas for the pixel scene and WebAudio for the sound effects. There's no backend: progress is saved in `localStorage`.
