import { useEffect, useMemo, useRef, useState } from "react";
import { quest } from "./data/quest";
import HonorableMentionScene from "./features/final/HonorableMentionScene";
import HeroScreen from "./features/home/HeroScreen";
import SakuraPetalsBackground from "./features/home/SakuraPetalsBackground";
import StepView from "./features/quest/StepView";
import { resolveMediaSrc } from "./features/quest/media";
import { useQuest } from "./features/quest/useQuest";

type Screen = "intro" | "quest" | "honorable" | "done";
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
  const [isIntroTransitioning, setIsIntroTransitioning] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayRetryBound = useRef(false);
  const previousVolumeRef = useRef(0.3);
  const resumeBackgroundAfterSuppressionRef = useRef(false);
  const mouseGlowRef = useRef<HTMLDivElement | null>(null);
  const glowFrameRef = useRef<number | null>(null);

  const { step, submit, reset, state, total } = useQuest();
  const isVideoStep = screen === "quest" && !!step?.blocks?.some((block) => block.type === "video");
  const isBackgroundSuppressed = screen === "honorable" || isVideoStep;
  const heroImage = useMemo(() => resolveMediaSrc("/media/hero-start.jpg"), []);
  const backgroundAudioSrc = backgroundAudioBlock ? resolveMediaSrc(backgroundAudioBlock.src) : null;

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 1700);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.muted = volume === 0;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isBackgroundSuppressed) {
      if (!audio.paused) {
        resumeBackgroundAfterSuppressionRef.current = true;
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (!resumeBackgroundAfterSuppressionRef.current || volume <= 0) {
      return;
    }

    resumeBackgroundAfterSuppressionRef.current = false;
    void audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        return;
      });
  }, [isBackgroundSuppressed, isPlaying, volume]);

  useEffect(() => {
    if (!state.done) return;
    setToast(null);
    setScreen("honorable");
  }, [state.done]);

  useEffect(() => {
    const glow = mouseGlowRef.current;
    if (!glow) return;

    const handleMove = (event: PointerEvent) => {
      const { clientX, clientY } = event;
      glow.classList.add("is-active");

      if (glowFrameRef.current !== null) {
        window.cancelAnimationFrame(glowFrameRef.current);
      }

      glowFrameRef.current = window.requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate3d(-50%, -50%, 0)`;
      });
    };

    const handleLeave = () => {
      glow.classList.remove("is-active");
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      if (glowFrameRef.current !== null) {
        window.cancelAnimationFrame(glowFrameRef.current);
      }
      window.removeEventListener("pointermove", handleMove);
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

    if (isBackgroundSuppressed) {
      resumeBackgroundAfterSuppressionRef.current = false;
      notify("neutral", "Фоновая музыка на паузе", "Во время видео и honorable mention работает только звук текущей сцены.");
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        notify("neutral", "Музыка ждёт", "Нажмите ещё раз после взаимодействия со страницей.");
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }

  function handleVolumeChange(nextVolume: number) {
    setVolume(nextVolume);
    if (nextVolume > 0) {
      previousVolumeRef.current = nextVolume;
    } else {
      resumeBackgroundAfterSuppressionRef.current = false;
    }
  }

  function toggleMute() {
    if (volume === 0) {
      const restoredVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.3;
      setVolume(restoredVolume);
      return;
    }

    previousVolumeRef.current = volume;
    resumeBackgroundAfterSuppressionRef.current = false;
    setVolume(0);
  }

  function handleReset() {
    reset();
    setIsIntroTransitioning(false);
    setScreen("intro");
    setToast(null);
    notify("neutral", "Прогресс сброшен", "Можно начать квест заново.");
  }

  function handleStartQuest() {
    if (isIntroTransitioning) return;

    setIsIntroTransitioning(true);
    window.setTimeout(() => {
      setScreen("quest");
      setIsIntroTransitioning(false);
    }, 360);
  }

  return (
    <div className="appShell">
      <div className="bg">
        <div className="bgNoise" />
        <div className="aurora auroraPrimary" />
        <div className="aurora auroraSecondary" />
        <div className="aurora auroraAccent" />
        <SakuraPetalsBackground />
        <div ref={mouseGlowRef} className="mouseGlow" />
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
            <button className="audioToggle" type="button" onClick={toggleAudio} aria-label={isPlaying ? "Пауза" : "Воспроизвести"}>
              <AudioPlayIcon playing={isPlaying} />
            </button>
            <button
              className={`audioMuteButton ${volume === 0 ? "is-muted" : ""}`}
              type="button"
              onClick={toggleMute}
              aria-label={volume === 0 ? "Включить звук" : "Выключить звук"}
            >
              <AudioVolumeIcon muted={volume === 0} />
            </button>
            <input
              className="slider volumeSlider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => handleVolumeChange(Number(event.target.value))}
              aria-label="Громкость фоновой музыки"
            />
          </div>
        )}

        {toast && (
          <div className={`toast toast-${toast.tone}`}>
            <div className="toastPulse" />
            <div className="toastBody">
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
              isMuted={volume === 0}
              isTransitioning={isIntroTransitioning}
              volume={volume}
              onToggleMute={toggleMute}
              onVolumeChange={handleVolumeChange}
              onToggleAudio={toggleAudio}
              onStart={handleStartQuest}
            />
          )}

          {screen === "quest" && step && !state.done && (
            <div key={step.id} className="stepEnter">
              <StepView
                step={step}
                stepNumber={state.index + 1}
                total={total}
                onToast={notify}
                onSubmit={(value) => submit(value)}
                onReset={handleReset}
              />
            </div>
          )}

          {screen === "honorable" && (
            <HonorableMentionScene onSkip={() => setScreen("done")} />
          )}

          {screen === "done" && (
            <section className="doneLayout glowPanel screenEnter">
              <div className="sectionBadge">Финал</div>
              <h1 className="heroTitle">Квест завершён. Финальный подарок разблокирован.</h1>
              <p className="heroSubtitle">
                Сцена honorable mention уже показана. Этот экран остаётся чистым final complete state, куда можно вернуться
                после паузы, улыбки и достойного уважения к легендарному кадру.
              </p>

              <div className="doneCardGrid">
                <a className="rewardCard glowInset" href="https://example.com" target="_blank" rel="noreferrer">
                  <span className="sectionBadge">Подарок</span>
                  <strong>Открыть финальный сюрприз</strong>
                  <p>Переход к основному подарку в новой вкладке.</p>
                </a>
                <div className="rewardCard glowInset">
                  <span className="sectionBadge">Прогресс</span>
                  <strong>100% синхронизировано</strong>
                  <p>Все вопросы пройдены. Финальная сцена завершена.</p>
                </div>
              </div>

              <div className="heroActions">
                <button className="btn btn-primary" type="button" onClick={handleReset}>
                  Начать заново
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function AudioPlayIcon({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="7" y="5" width="3.5" height="14" rx="1.2" />
        <rect x="13.5" y="5" width="3.5" height="14" rx="1.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6.5C8 5.72 8.84 5.24 9.5 5.63L18 10.63C18.64 11.01 18.64 11.99 18 12.37L9.5 17.37C8.84 17.76 8 17.28 8 16.5V6.5Z" />
    </svg>
  );
}

function AudioVolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10.5H8.4L12.6 6.8C13.12 6.34 13.94 6.71 13.94 7.4V16.6C13.94 17.29 13.12 17.66 12.6 17.2L8.4 13.5H5C4.45 13.5 4 13.05 4 12.5V11.5C4 10.95 4.45 10.5 5 10.5Z" />
      {muted ? (
        <path d="M17.2 8.8L21 16.2" />
      ) : (
        <>
          <path d="M17.2 9.2C18.12 10.03 18.67 11.22 18.67 12.5C18.67 13.78 18.12 14.97 17.2 15.8" />
          <path d="M18.9 6.8C20.43 8.17 21.33 10.27 21.33 12.5C21.33 14.73 20.43 16.83 18.9 18.2" />
        </>
      )}
    </svg>
  );
}
