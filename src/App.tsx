import { useEffect, useMemo, useRef, useState } from "react";
import { quest } from "./data/quest";
import StepView from "./features/quest/StepView";
import { resolveMediaSrc } from "./features/quest/media";
import { useQuest } from "./features/quest/useQuest";

type Screen = "intro" | "quest" | "done";
type ToastTone = "neutral" | "success";

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
  const [volume, setVolume] = useState(0.36);
  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0, active: false });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayRetryBound = useRef(false);

  const { step, submit, reset, state, total } = useQuest();
  const progressPercent = total > 0 ? Math.round(((state.done ? total : state.index + 1) / total) * 100) : 0;

  const heroVideo = useMemo(() => resolveMediaSrc("/media/step4.mp4"), []);
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

        <div className="floatingPlayer glowPanel">
          <div className={`playerDot ${isPlaying ? "is-active" : ""}`} aria-hidden="true" />
          <input
            className="slider slider-premium"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="Background audio volume"
          />
        </div>

        {toast && (
          <div className={`toast toast-${toast.tone}`}>
            <div className="toastPulse" />
            <div>
              <div className="toastTitle">{toast.title}</div>
              <div className="toastText">{toast.message}</div>
            </div>
          </div>
        )}

        <div className="container">
          {screen === "intro" && (
            <section className="heroLayout">
              <div className="heroCopy glowPanel screenEnter">
                <div className="sectionBadge">Quest protocol</div>
                <h1 className="heroTitle">Cinematic sci-fi quest with premium control surfaces.</h1>
                <p className="heroSubtitle">
                  Запусти пошаговый опыт с медиа, вариантами ответа и мягкой атмосферой дорогого продукта. Прогресс
                  сохраняется автоматически, а фон остаётся живым и аккуратно подсвеченным.
                </p>

                <div className="heroStats">
                  <div className="statCard glowInset">
                    <span className="statLabel">Sequence</span>
                    <strong>{total} steps</strong>
                  </div>
                  <div className="statCard glowInset">
                    <span className="statLabel">Current state</span>
                    <strong>{state.done ? "Complete" : `Step ${state.index + 1}/${total}`}</strong>
                  </div>
                  <div className="statCard glowInset">
                    <span className="statLabel">Playback</span>
                    <strong>{isPlaying ? "Live ambience" : "Autoplay standby"}</strong>
                  </div>
                </div>

                <div className="heroActions">
                  <button className="btn btn-primary" type="button" onClick={() => setScreen("quest")}>
                    Start quest
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={handleReset}>
                    Reset progress
                  </button>
                </div>
              </div>

              <div className="heroVisual screenEnter">
                <div className="heroHalo" />
                <div className="heroMediaCard glowPanel">
                  <div className="mediaFrame mediaFrame-video">
                    <video
                      className="heroVideo"
                      src={heroVideo}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                    <div className="heroOverlay">
                      <span className="overlayChip">Decision moment</span>
                      <strong>Paused energy, cinematic tension, high-contrast UI framing.</strong>
                    </div>
                  </div>
                  <div className="heroSupplemental">
                    <div className="suppCard glowInset">
                      <img className="suppImage" src={heroImage} alt="Quest preview" />
                    </div>
                    <div className="suppCard glowInset">
                      <div className="systemCard">
                        <div className="sectionBadge">Cipher / progress</div>
                        <div className="progressMeter">
                          <div className="progressFill" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="systemRows">
                          <div className="systemRow">
                            <span>Status</span>
                            <strong>{state.done ? "Resolved" : "Awaiting input"}</strong>
                          </div>
                          <div className="systemRow">
                            <span>Signal</span>
                            <strong>Stable</strong>
                          </div>
                          <div className="systemRow">
                            <span>Render</span>
                            <strong>Pages-ready</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {screen === "quest" && step && !state.done && (
            <div className="screenEnter">
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
                Финальный экран теперь оформлен как завершённый premium-state: мягкие ореолы, спокойная системная
                панель и чистая композиция без визуального шума.
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
