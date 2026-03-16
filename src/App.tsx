import { useEffect, useMemo, useRef, useState } from "react";
import { quest } from "./data/quest";
import HeroScreen from "./features/home/HeroScreen";
import SakuraPetalsBackground from "./features/home/SakuraPetalsBackground";
import StepView from "./features/quest/StepView";
import { resolveMediaSrc } from "./features/quest/media";
import { useQuest } from "./features/quest/useQuest";

type Screen = "intro" | "quest" | "done";
type ToastTone = "neutral" | "success" | "error";

type ToastState = {
  id: number;
  tone: ToastTone;
  title: string;
  message: string;
} | null;

const backgroundAudioBlock = quest
  .flatMap((step) => step.blocks ?? [])
  .find((block) => block.type === "audio");

export default function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [toast, setToast] = useState<ToastState>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0, active: false });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayRetryBound = useRef(false);

  const { step, submit, reset, state, total } = useQuest();
  const heroImage = useMemo(() => resolveMediaSrc("/media/step2.jpg"), []);
  const backgroundAudioSrc = backgroundAudioBlock ? resolveMediaSrc(backgroundAudioBlock.src) : null;

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!state.done) return;
    setScreen("done");
  }, [state.done]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      setCursorGlow({ x: event.clientX, y: event.clientY, active: true });
    };

    const handleLeave = () => {
      setCursorGlow((current) => ({ ...current, active: false }));
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    const startPlayback = async () => {
      try {
        await audio.play();
        if (!cancelled) {
          setIsPlaying(true);
        }
      } catch {
        if (autoplayRetryBound.current) return;

        autoplayRetryBound.current = true;
        const retry = async () => {
          try {
            await audio.play();
            setIsPlaying(true);
          } catch {
            return;
          } finally {
            window.removeEventListener("pointerdown", retry);
            window.removeEventListener("keydown", retry);
          }
        };

        window.addEventListener("pointerdown", retry, { once: true });
        window.addEventListener("keydown", retry, { once: true });
      }
    };

    void startPlayback();

    return () => {
      cancelled = true;
    };
  }, []);

  function notify(tone: ToastTone, title: string, message: string) {
    setToast({ id: Date.now(), tone, title, message });
  }

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        notify("neutral", "Audio standby", "Нажмите ещё раз после взаимодействия со страницей.");
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }

  function handleReset() {
    reset();
    setScreen("intro");
    notify("neutral", "Progress cleared", "Cipher state reset. You can start again at any time.");
  }

  return (
    <div className="appShell">
      <div className="bg">
        <div className="bgNoise" />
        <div className="aurora auroraPrimary" />
        <div className="aurora auroraSecondary" />
        <div className="aurora auroraAccent" />
        <SakuraPetalsBackground />
        <div className={`mouseGlow ${cursorGlow.active ? "is-active" : ""}`} style={{ left: cursorGlow.x, top: cursorGlow.y }} />
        <div className="grid" />
        <div className="vignette" />

        {backgroundAudioSrc && (
          <audio
            ref={audioRef}
            src={backgroundAudioSrc}
            loop
            preload="auto"
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}

        {screen !== "intro" && (
          <div className="floatingPlayer glowPanel">
            <button className="audioToggle" type="button" onClick={toggleAudio} aria-label={isPlaying ? "Pause audio" : "Play audio"}>
              {isPlaying ? "II" : ">"}
            </button>
            <input
              className="slider volumeSlider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label="Background audio volume"
            />
          </div>
        )}

        {toast && (
          <div className={`toast toast-${toast.tone}`}>
            <div className="toastPulse" />
            <div>
              <div className="toastTitle">{toast.title}</div>
              <div className="toastText">{toast.message}</div>
            </div>
          </div>
        )}

        <div className={`container ${screen === "intro" ? "container-intro" : ""}`}>
          {screen === "intro" && (
            <HeroScreen
              heroImage={heroImage}
              isPlaying={isPlaying}
              volume={volume}
              onVolumeChange={setVolume}
              onToggleAudio={toggleAudio}
              onStart={() => setScreen("quest")}
            />
          )}

          {screen === "quest" && step && !state.done && (
            <div key={step.id} className="screenEnter">
              <StepView
                step={step}
                stepNumber={state.index + 1}
                total={total}
                onToast={notify}
                onSubmit={(value) => {
                  const result = submit(value);
                  if (result.ok && result.finished) {
                    notify("success", "Quest complete", "Final sequence unlocked.");
                  }
                  return result;
                }}
                onReset={handleReset}
              />
            </div>
          )}

          {screen === "done" && (
            <section className="doneLayout glowPanel screenEnter">
              <div className="sectionBadge">Sequence complete</div>
              <h1 className="heroTitle">You cleared the quest and unlocked the final reward layer.</h1>
              <p className="heroSubtitle">
                Финальный экран оформлен как завершённый premium-state: мягкие ореолы, спокойная системная панель и
                чистая композиция без визуального шума.
              </p>

              <div className="doneCardGrid">
                <a className="rewardCard glowInset" href="https://example.com" target="_blank" rel="noreferrer">
                  <span className="sectionBadge">Reward link</span>
                  <strong>Open gift payload</strong>
                  <p>Открывает финальный подарок в новой вкладке.</p>
                </a>
                <div className="rewardCard glowInset">
                  <span className="sectionBadge">Progress</span>
                  <strong>100% synchronized</strong>
                  <p>Все шаги завершены. Хранилище прогресса обновлено локально.</p>
                </div>
              </div>

              <div className="heroActions">
                <button className="btn btn-primary" type="button" onClick={handleReset}>
                  Restart experience
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
