/**
 * Chiptune sound effects synthesized with WebAudio — no audio files.
 * The AudioContext is only created after the first user gesture (browsers require it anyway).
 */
import type { Tier } from '../lib/types';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (master) master.gain.value = on ? 0.18 : 0;
}

/** Call from a user gesture (click/keydown). Safe to call repeatedly. */
export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.18 : 0;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
}

type Wave = OscillatorType;

function tone(freq: number, start: number, dur: number, wave: Wave = 'square', vol = 1, slideTo?: number) {
  if (!ctx || !master || !enabled) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(start: number, dur: number, vol = 0.6, lowpass = 900) {
  if (!ctx || !master || !enabled) return;
  const t = ctx.currentTime + start;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(filter).connect(g).connect(master);
  src.start(t);
}

const note = (semitonesFromA4: number) => 440 * 2 ** (semitonesFromA4 / 12);

export const sfx = {
  click: () => tone(note(7), 0, 0.04, 'square', 0.4),
  tick: () => tone(note(24), 0, 0.03, 'square', 0.35),
  warnTick: () => tone(note(15), 0, 0.06, 'square', 0.55),
  submit: () => {
    noise(0, 0.12, 0.5, 1400);
    tone(note(-12), 0, 0.12, 'triangle', 0.8, note(-17));
  },
  /** Rising arpeggio: rarer tiers climb higher and longer. */
  tier: (tier: Tier) => {
    const steps: Record<Tier, number[]> = {
      technical: [0, 3],
      bedrock: [0, 4],
      ore: [0, 4, 7],
      vein: [2, 7, 11],
      trace: [4, 9, 12, 16],
      rare: [7, 12, 16, 19],
      mole: [12, 16, 19, 24, 28],
    };
    const wave: Wave = tier === 'technical' ? 'triangle' : 'square';
    steps[tier].forEach((s, i) => tone(note(s), i * 0.07, 0.12, wave, 0.55));
    if (tier === 'mole') tone(note(36), 0.4, 0.35, 'triangle', 0.5);
  },
  thud: () => {
    tone(note(-28), 0, 0.25, 'triangle', 1, note(-36));
    noise(0, 0.15, 0.35, 300);
  },
  stall: () => {
    tone(note(-5), 0, 0.18, 'square', 0.5, note(-17));
    tone(note(-17), 0.18, 0.3, 'square', 0.45, note(-29));
  },
  dig: () => noise(0, 0.05, 0.25, 600),
  /** soft bit-crushed whoosh under the pixel wipe */
  wipe: () => {
    noise(0, 0.22, 0.22, 2400);
    [0, 5, 10, 15].forEach((s, i) => tone(note(s - 12), i * 0.05, 0.06, 'square', 0.18));
  },
  jingle: () => [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => tone(note(s), i * 0.09, 0.14, 'square', 0.45)),
  error: () => tone(note(-9), 0, 0.12, 'square', 0.4, note(-12)),
};
