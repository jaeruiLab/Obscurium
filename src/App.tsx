import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx, unlockAudio } from './audio/sfx';
import { Hud } from './components/Hud';
import { Icon } from './components/Icons';
import { About, HowToPlay, Privacy, Skins } from './components/InfoPanels';
import { Menu, type MenuItem } from './components/Menu';
import { Modal } from './components/Modal';
import { usePixelWipe } from './components/PixelWipe';
import { PromptCard } from './components/PromptCard';
import { Results } from './components/Results';
import { Reveal } from './components/Reveal';
import { SettingsPanel } from './components/SettingsPanel';
import { StatsSummary } from './components/StatsPanel';
import { TitleScreen } from './components/TitleScreen';
import { digNumber, PROMPT_BY_ID, SECONDS_PER_PROMPT } from './lib/daily';
import { el } from './lib/elements';
import { TIER_LABEL } from './lib/scoring';
import { liveStreak, type DigRecord } from './lib/storage';
import { SceneCanvas } from './scene/SceneCanvas';
import { depthFor, totalPoints } from './state/gameReducer';
import { useSave } from './state/save';
import { useGame, type TrackedKind } from './state/useGame';
import { useDeadline } from './state/useTimer';

type ModalId = 'how' | 'stats' | 'settings' | 'about' | 'privacy' | 'skins';
const MODAL_TITLE: Record<ModalId, string> = {
  how: 'HOW TO PLAY',
  stats: 'STATS',
  settings: 'SETTINGS',
  about: 'ABOUT',
  privacy: 'PRIVACY',
  skins: 'MOLE SKINS',
};

const introMsFor = (index: number) => (index === 0 ? 3000 : 2000);

export function App() {
  const { save, setSetting, reducedMotion } = useSave();
  const game = useGame();
  const wipe = usePixelWipe();
  const { state } = game;
  const run = state.screen === 'run' ? state : null;

  const [modal, setModal] = useState<ModalId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewing, setViewing] = useState<{ record: DigRecord; kind: TrackedKind } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [announce, setAnnounce] = useState('');

  const settings = save.settings;
  // Browsers only allow audio after a user gesture.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Keep the mobile layout above the on-screen keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const set = () => document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
    set();
    vv.addEventListener('resize', set);
    return () => vv.removeEventListener('resize', set);
  }, []);

  // intro → prompt after the 3-2-1
  useEffect(() => {
    if (!run || run.phase !== 'intro') return;
    const wait = run.phaseStartedAt + introMsFor(run.index) - Date.now();
    const id = setTimeout(game.beginPrompt, Math.max(0, wait));
    return () => clearTimeout(id);
  }, [run?.phase, run?.index, run?.phaseStartedAt, game.beginPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  // the 25-second clock (wall-clock deadline, so hidden-tab time still counts)
  const deadline = run?.phase === 'prompt' ? run.phaseStartedAt + SECONDS_PER_PROMPT * 1000 : null;
  useDeadline(deadline, () => game.submit(null, 'timeout'));

  // warning ticks for the last five seconds
  const lastWarn = useRef<number | null>(null);
  useEffect(() => {
    if (deadline == null) return;
    lastWarn.current = null;
    const id = setInterval(() => {
      const secs = Math.ceil((deadline - Date.now()) / 1000);
      if (secs <= 5 && secs > 0 && secs !== lastWarn.current) {
        lastWarn.current = secs;
        sfx.warnTick();
        if (secs === 5) setAnnounce('5 seconds left');
      }
    }, 100);
    return () => clearInterval(id);
  }, [deadline]);

  // reveal feedback: sound, shake, screen-reader announcement
  const revealed = run?.phase === 'reveal' ? run.answers[run.answers.length - 1] : null;
  useEffect(() => {
    if (!revealed) return;
    if (revealed.z == null) {
      sfx.stall();
      setAnnounce('Drill stalled. No points.');
    } else if (!revealed.tier) {
      sfx.thud();
      setShakeKey((k) => k + 1);
      setAnnounce(`${el(revealed.z).name} doesn’t count. No points.`);
    } else {
      sfx.tier(revealed.tier);
      setAnnounce(`${el(revealed.z).name}: ${TIER_LABEL[revealed.tier]}, ${revealed.points} points.`);
    }
  }, [revealed]);

  useEffect(() => {
    if (run?.phase === 'results') sfx.jingle();
  }, [run?.phase]);

  const onDigTick = useCallback(() => sfx.dig(), []);

  const pickMenu = (item: MenuItem) => {
    setMenuOpen(false);
    if (item === 'surface') wipe(game.quit);
    else setModal(item);
  };

  const todayRecord = save.history[game.todayKey];
  const todayChallenge = save.challengeHistory[game.todayKey];
  // rebuild from the record's own prompt ids, so old digs survive prompt-bank changes
  const viewingPrompts = viewing ? viewing.record.answers.map((a) => PROMPT_BY_ID.get(a.promptId)).filter((p) => p != null) : [];
  const sceneDepth = run ? depthFor(run.answers) : viewing ? viewing.record.points * 10 : 0;

  return (
    <>
      <SceneCanvas mode={run || viewing ? 'run' : 'title'} depthM={sceneDepth} reducedMotion={reducedMotion} shakeKey={shakeKey} onDigTick={onDigTick} />
      {settings.scanlines && <div className="crt" aria-hidden="true" />}

      <div className="corner corner-left">
        <button type="button" className="icon-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <Icon name="menu" />
        </button>
      </div>
      <div className="corner corner-right">
        <button type="button" className="icon-btn" aria-label={settings.sound ? 'Mute sound' : 'Unmute sound'} aria-pressed={!settings.sound} onClick={() => setSetting('sound', !settings.sound)}>
          <Icon name={settings.sound ? 'soundOn' : 'soundOff'} />
        </button>
        <button type="button" className="icon-btn" aria-label="Settings" onClick={() => setModal('settings')}>
          <Icon name="gear" />
        </button>
        <button type="button" className="icon-btn" aria-label="Mole skins" onClick={() => setModal('skins')}>
          <Icon name="hardhat" />
        </button>
      </div>

      {!run && !viewing && (
        <TitleScreen
          digNumber={digNumber(game.todayKey)}
          streak={liveStreak(save.streak, game.todayKey)}
          doneToday={!!todayRecord}
          resumable={save.inProgress?.dateKey === game.todayKey}
          challengeDone={!!todayChallenge}
          challengeResumable={save.challengeInProgress?.dateKey === game.todayKey}
          onBegin={() => wipe(game.startDaily)}
          onViewToday={() => todayRecord && wipe(() => setViewing({ record: todayRecord, kind: 'daily' }))}
          onChallenge={() => wipe(game.startChallenge)}
          onViewChallenge={() => todayChallenge && wipe(() => setViewing({ record: todayChallenge, kind: 'challenge' }))}
          onEvent={() => wipe(() => game.startPack('halloween'))}
          onPrivacy={() => setModal('privacy')}
        />
      )}

      {viewing && (
        <main className="run-screen results-screen">
          <Results
            prompts={viewingPrompts}
            answers={viewing.record.answers}
            digNumber={viewing.record.digNumber}
            challenge={viewing.kind === 'challenge'}
            showStats={viewing.kind === 'daily'}
            onClose={() => wipe(() => setViewing(null))}
          />
        </main>
      )}

      {run && (
        <main className={`run-screen phase-${run.phase}`}>
          {run.phase !== 'results' && <Hud answers={run.answers} total={run.run.prompts.length} current={run.index} points={totalPoints(run.answers)} />}
          {(run.phase === 'intro' || run.phase === 'prompt') && (
            <PromptCard
              key={run.index}
              prompt={run.run.prompts[run.index]}
              index={run.index}
              total={run.run.prompts.length}
              phase={run.phase}
              phaseStartedAt={run.phaseStartedAt}
              introMs={introMsFor(run.index)}
              showTimer={settings.showTimer}
              acceptNumbers={settings.acceptNumbers}
              onSubmit={(z) => {
                sfx.submit();
                game.submit(z, 'type');
              }}
              onMiss={sfx.error}
            />
          )}
          {run.phase === 'reveal' && revealed && (
            <Reveal
              key={run.index}
              prompt={run.run.prompts[run.index]}
              answer={revealed}
              index={run.index}
              total={run.run.prompts.length}
              glyphs={settings.colorblind}
              onNext={() => {
                sfx.click();
                // the last reveal hands off to the results page behind a full wipe
                if (run.index >= run.run.prompts.length - 1) wipe(game.next);
                else game.next();
              }}
            />
          )}
          {run.phase === 'results' && (
            <Results
              prompts={run.run.prompts}
              answers={run.answers}
              digNumber={run.run.digNumber}
              packLabel={run.run.packLabel}
              challenge={run.run.kind === 'challenge'}
              showStats={run.run.kind === 'daily'}
              onClose={() => wipe(game.quit)}
            />
          )}
        </main>
      )}

      {menuOpen && <Menu inRun={!!run && run.phase !== 'results'} onPick={pickMenu} onClose={() => setMenuOpen(false)} />}
      {modal && (
        <Modal title={MODAL_TITLE[modal]} onClose={() => setModal(null)} wide={modal === 'stats'}>
          {modal === 'how' && <HowToPlay />}
          {modal === 'stats' && <StatsSummary />}
          {modal === 'settings' && <SettingsPanel />}
          {modal === 'about' && <About />}
          {modal === 'privacy' && <Privacy />}
          {modal === 'skins' && <Skins />}
        </Modal>
      )}

      <div className="sr-only" aria-live="polite" role="status">
        {announce}
      </div>
    </>
  );
}
