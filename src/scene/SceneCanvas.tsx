import { useEffect, useRef } from 'react';
import {
  drawClouds,
  drawDrill,
  drawGauge,
  drawGrass,
  drawGround,
  drawHills,
  drawMinerals,
  drawMole,
  drawParticles,
  drawRig,
  drawSky,
  drawSun,
  drawTitleShade,
  makeClouds,
  rigX,
  type SceneState,
} from './draw';
import { depthToPx, DRILL_START_PX, dustColor, M_PER_PX, renderGround } from './world';

export type SceneProps = {
  mode: 'title' | 'run';
  /** drill depth in meters (score × 10) */
  depthM: number;
  reducedMotion: boolean;
  /** increments to trigger a small camera shake (invalid answer thud) */
  shakeKey?: number;
  /** called each time the drill passes another 100 m while digging */
  onDigTick?: () => void;
};

const RETRACTED_PX = -4;

/** Integer scale in device pixels so the pixel art stays crisp; internal size ≈ 480×270. */
function measure() {
  const dpr = window.devicePixelRatio || 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const devW = vw * dpr;
  const devH = vh * dpr;
  const scale = Math.max(1, Math.round(Math.min(devW / 240, devH / 270)));
  return { W: Math.ceil(devW / scale), H: Math.ceil(devH / scale), cssScale: scale / dpr };
}

export function SceneCanvas(props: SceneProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  live.current = props;

  useEffect(() => {
    const canvas = ref.current!;
    const g = canvas.getContext('2d')!;
    const s: SceneState = {
      W: 0,
      H: 0,
      t: 0,
      camTop: 0,
      drillPx: RETRACTED_PX,
      moleX: 0,
      moleY: 0,
      titleBlend: live.current.mode === 'title' ? 1 : 0,
      shake: 0,
      ground: null,
      particles: [],
      clouds: [],
      chunks: new Map(),
    };
    let lastShakeKey = live.current.shakeKey ?? 0;
    let tween = { from: s.drillPx, to: s.drillPx, t: 1, dur: 1 };
    let lastTickM = 0;

    const targetDrill = () =>
      live.current.mode === 'title' ? RETRACTED_PX : DRILL_START_PX + depthToPx(live.current.depthM);
    const targetCam = () =>
      live.current.mode === 'title'
        ? -Math.round(s.H * 0.57)
        : Math.max(-Math.round(s.H * 0.26), Math.round(s.drillPx - s.H * 0.62));
    const moleTarget = () =>
      live.current.mode === 'title'
        ? { x: Math.round(s.W * 0.66) - 6, y: 9 }
        : { x: rigX(s) - 6, y: s.drillPx - 13 };

    const resize = () => {
      const { W, H, cssScale } = measure();
      const widthChanged = W !== s.W;
      s.W = W;
      s.H = H;
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${W * cssScale}px`;
      canvas.style.height = `${H * cssScale}px`;
      g.imageSmoothingEnabled = false;
      if (widthChanged) {
        s.ground = renderGround(W);
        s.clouds = makeClouds(W, H);
      }
      s.camTop = targetCam();
      const m = moleTarget();
      s.moleX = m.x;
      s.moleY = m.y;
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const still = live.current.reducedMotion;
      s.t += dt;

      // drill tween toward the current target
      const target = targetDrill();
      if (target !== tween.to) {
        const dist = Math.abs(target - s.drillPx);
        tween = { from: s.drillPx, to: target, t: 0, dur: Math.min(1.8, 0.5 + dist / 140) };
        lastTickM = Math.max(0, Math.floor(((s.drillPx - DRILL_START_PX) * M_PER_PX) / 100));
      }
      if (tween.t < 1) {
        tween.t = still ? 1 : Math.min(1, tween.t + dt / tween.dur);
        const e = 1 - (1 - tween.t) ** 3;
        const prev = s.drillPx;
        s.drillPx = tween.from + (tween.to - tween.from) * e;
        const digging = s.drillPx > prev && s.drillPx > 0;
        if (digging && !still) {
          const color = dustColor(s.drillPx);
          for (let i = 0; i < 3; i++) {
            const max = 0.4 + Math.random() * 0.5;
            s.particles.push({ x: rigX(s) + (Math.random() - 0.5) * 4, y: s.drillPx, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 40, life: max, max, color });
          }
        }
        const tickM = Math.floor(((s.drillPx - DRILL_START_PX) * M_PER_PX) / 100);
        if (digging && tickM > lastTickM) {
          lastTickM = tickM;
          live.current.onDigTick?.();
        }
      }

      // particles
      for (const p of s.particles) {
        p.life -= dt;
        p.vy += 140 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      // camera, mole and title blend ease toward their targets
      const k = still ? 1 : 1 - Math.exp(-dt * 4.5);
      s.camTop += (targetCam() - s.camTop) * k;
      const m = moleTarget();
      const km = still ? 1 : 1 - Math.exp(-dt * 5);
      s.moleX += (m.x - s.moleX) * km;
      s.moleY += (m.y - s.moleY) * km;
      const blendTarget = live.current.mode === 'title' ? 1 : 0;
      s.titleBlend += (blendTarget - s.titleBlend) * (still ? 1 : 1 - Math.exp(-dt * 3));

      if (!still) {
        for (const c of s.clouds) {
          c.x += c.speed * dt;
          if (c.x > s.W + 4) c.x = -60;
        }
      }
      const sk = live.current.shakeKey ?? 0;
      if (sk !== lastShakeKey) {
        lastShakeKey = sk;
        if (!still) s.shake = 0.3;
      }
      s.shake = Math.max(0, s.shake - dt);
      const shakeY = s.shake > 0 ? Math.round(Math.sin(s.t * 70) * 2 * (s.shake / 0.3)) : 0;

      const cam = Math.round(s.camTop) + shakeY;
      drawSky(g, s, cam);
      drawSun(g, s, cam);
      drawClouds(g, s, cam);
      drawHills(g, s, cam);
      drawGround(g, s, cam);
      drawMinerals(g, s, cam, still);
      drawGrass(g, s, cam);
      drawRig(g, s, cam);
      drawDrill(g, s, cam);
      drawParticles(g, s, cam);
      drawMole(g, s, cam, still);
      drawGauge(g, s, cam);
      drawTitleShade(g, s);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="scene" aria-hidden="true" />;
}
