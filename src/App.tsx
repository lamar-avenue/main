import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { QuestStep } from "./data/quest";
import CreditsScreen from "./features/final/CreditsScreen";
import { BACKGROUND_TRACKS, createShuffledTrackOrder } from "./features/audio/backgroundTracks";
import { useUiSoundDesign } from "./features/audio/soundDesign";
import HonorableMentionScene from "./features/final/HonorableMentionScene";
import HeroScreen from "./features/home/HeroScreen";
import SakuraPetalsBackground from "./features/home/SakuraPetalsBackground";
import StepView from "./features/quest/StepView";
import { resolveMediaSrc } from "./features/quest/media";
import { useQuest } from "./features/quest/useQuest";

type Screen = "intro" | "quest" | "honorable" | "credits" | "done";
type ToastTone = "neutral" | "success" | "error";

type ToastState = {
  id: number;
  tone: ToastTone;
  title: string;
  message: string;
} | null;

type CinematicPause = {
  key: string;
  kicker: string;
  title: string;
  durationMs: number;
};

type PlaylistState = {
  order: number[];
  position: number;
};

type NavigatorWithDeviceMemory = Navigator & {
  deviceMemory?: number;
};

function getCinematicPause(screen: Screen, step?: QuestStep): CinematicPause | null {
  if (screen === "quest" && step) {
    const hasVideoBlock = step.blocks?.some((block) => block.type === "video");

    if (step.id === "1") {
      return {
        key: `quest-${step.id}`,
        kicker: "Синхронизация",
        title: "Маршрут открыт",
        durationMs: 820,
      };
    }

    if (hasVideoBlock) {
      return {
        key: `quest-${step.id}`,
        kicker: "Ключевой кадр",
        title: "Смотри внимательно",
        durationMs: 920,
      };
    }
  }

  if (screen === "honorable") {
    return {
      key: "honorable",
      kicker: "Пауза",
      title: "Особый кадр",
      durationMs: 980,
    };
  }

  if (screen === "credits") {
    return {
      key: "credits",
      kicker: "Финал",
      title: "Последний свет перед титрами",
      durationMs: 920,
    };
  }

  return null;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [isIntroTransitioning, setIsIntroTransitioning] = useState(false);
  const [isHonorableExiting, setIsHonorableExiting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.1);
  const [activeSceneAudioSourceId, setActiveSceneAudioSourceId] = useState<string | null>(null);
  const [playlistState, setPlaylistState] = useState<PlaylistState>(() => ({
    order: createShuffledTrackOrder(BACKGROUND_TRACKS.length),
    position: 0,
  }));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayRetryBound = useRef(false);
  const previousVolumeRef = useRef(0.1);
  const resumeBackgroundAfterSuppressionRef = useRef(false);
  const pendingTrackAutoplayRef = useRef(false);
  const previousCycleOrdersRef = useRef<number[][]>([]);
  const mouseGlowRef = useRef<HTMLDivElement | null>(null);
  const glowFrameRef = useRef<number | null>(null);
  const cinematicPauseTimeoutRef = useRef<number | null>(null);
  const previousQuestStepKeyRef = useRef<string | null>(null);
  const previousScreenRef = useRef<Screen>("intro");
  const [cinematicPause, setCinematicPause] = useState<CinematicPause | null>(null);
  const { playUiSound } = useUiSoundDesign();

  const { step, submit, reset, state, total } = useQuest();
  const previousDoneRef = useRef(state.done);
  const effectsMode = useMemo<"default" | "lite">(() => {
    if (typeof window === "undefined") return "default";

    const navigatorWithDeviceMemory = navigator as NavigatorWithDeviceMemory;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const narrowViewport = window.matchMedia("(max-width: 900px)").matches;
    const lowCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 6;
    const lowMemory =
      typeof navigatorWithDeviceMemory.deviceMemory === "number" && navigatorWithDeviceMemory.deviceMemory <= 4;

    return reducedMotion || coarsePointer || narrowViewport || lowCpu || lowMemory ? "lite" : "default";
  }, []);
  const isVideoStep = screen === "quest" && !!step?.blocks?.some((block) => block.type === "video");
  const isBackgroundSuppressed = screen === "honorable" || isVideoStep || activeSceneAudioSourceId !== null;
  const currentBackgroundTrack = BACKGROUND_TRACKS[playlistState.order[playlistState.position] ?? 0];
  const heroImage = useMemo(() => resolveMediaSrc("/media/images/hero-start.jpg"), []);
  const backgroundAudioSrc = currentBackgroundTrack ? resolveMediaSrc(currentBackgroundTrack.src) : null;

  useEffect(() => {
    return () => {
      if (cinematicPauseTimeoutRef.current !== null) {
        window.clearTimeout(cinematicPauseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (screen !== "quest" || !step) {
      previousQuestStepKeyRef.current = null;
      return;
    }

    const nextStepKey = `${screen}-${step.id}`;
    if (previousQuestStepKeyRef.current === nextStepKey) return;

    previousQuestStepKeyRef.current = nextStepKey;
    playUiSound("step-open");
  }, [playUiSound, screen, step]);

  useEffect(() => {
    const previousScreen = previousScreenRef.current;
    previousScreenRef.current = screen;

    if (screen === "credits" && previousScreen !== "credits") {
      playUiSound("credits-open");
    }
  }, [playUiSound, screen]);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 1700);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    const nextPause = getCinematicPause(screen, step);

    if (cinematicPauseTimeoutRef.current !== null) {
      window.clearTimeout(cinematicPauseTimeoutRef.current);
      cinematicPauseTimeoutRef.current = null;
    }

    if (!nextPause) {
      setCinematicPause(null);
      return;
    }

    setCinematicPause(nextPause);
    cinematicPauseTimeoutRef.current = window.setTimeout(() => {
      setCinematicPause((current) => (current?.key === nextPause.key ? null : current));
      cinematicPauseTimeoutRef.current = null;
    }, nextPause.durationMs);
  }, [screen, step]);

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
    const wasDone = previousDoneRef.current;
    previousDoneRef.current = state.done;

    if (!state.done || wasDone) return;

    setToast(null);
    setIsHonorableExiting(false);
    setActiveSceneAudioSourceId(null);
    setScreen("honorable");
  }, [state.done]);

  useEffect(() => {
    if (screen === "quest") return;
    setActiveSceneAudioSourceId(null);
  }, [screen]);

  useEffect(() => {
    const glow = mouseGlowRef.current;
    if (!glow) return;

    if (
      effectsMode === "lite" ||
      typeof window === "undefined" ||
      !window.matchMedia("(pointer: fine)").matches ||
      !window.matchMedia("(hover: hover)").matches
    ) {
      glow.classList.remove("is-active");
      glow.style.transform = "translate3d(-999px, -999px, 0)";
      return;
    }

    let nextX = -999;
    let nextY = -999;

    const handleMove = (event: PointerEvent) => {
      nextX = event.clientX;
      nextY = event.clientY;

      if (!glow.classList.contains("is-active")) {
        glow.classList.add("is-active");
      }

      if (glowFrameRef.current !== null) return;

      glowFrameRef.current = window.requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) translate3d(-50%, -50%, 0)`;
        glowFrameRef.current = null;
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
  }, [effectsMode]);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !backgroundAudioSrc) return;

    audio.load();
    audio.volume = volume;
    audio.muted = volume === 0;

    if (!pendingTrackAutoplayRef.current || isBackgroundSuppressed || volume <= 0) {
      pendingTrackAutoplayRef.current = false;
      setIsPlaying(false);
      return;
    }

    pendingTrackAutoplayRef.current = false;
    void audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        return;
      });
  }, [backgroundAudioSrc, isBackgroundSuppressed, volume]);

  function moveToAdjacentTrack(direction: -1 | 1, shouldAutoplay: boolean) {
    pendingTrackAutoplayRef.current = shouldAutoplay;

    setPlaylistState((current) => {
      if (direction === 1) {
        if (current.position < current.order.length - 1) {
          return {
            order: current.order,
            position: current.position + 1,
          };
        }

        previousCycleOrdersRef.current = [...previousCycleOrdersRef.current, current.order];
        return {
          order: createShuffledTrackOrder(BACKGROUND_TRACKS.length),
          position: 0,
        };
      }

      if (current.position > 0) {
        return {
          order: current.order,
          position: current.position - 1,
        };
      }

      const previousOrder = previousCycleOrdersRef.current[previousCycleOrdersRef.current.length - 1];
      if (!previousOrder) {
        return current;
      }

      previousCycleOrdersRef.current = previousCycleOrdersRef.current.slice(0, -1);
      return {
        order: previousOrder,
        position: previousOrder.length - 1,
      };
    });
  }

  function handleNextTrack() {
    const audio = audioRef.current;
    const shouldAutoplay = !!audio && (!audio.paused || (isBackgroundSuppressed && resumeBackgroundAfterSuppressionRef.current));
    moveToAdjacentTrack(1, shouldAutoplay);
  }

  function handlePreviousTrack() {
    const audio = audioRef.current;
    const shouldAutoplay = !!audio && (!audio.paused || (isBackgroundSuppressed && resumeBackgroundAfterSuppressionRef.current));
    moveToAdjacentTrack(-1, shouldAutoplay);
  }

  function notify(tone: ToastTone, title: string, message: string) {
    if (tone === "success") {
      playUiSound("success");
    }

    if (tone === "error") {
      playUiSound("error");
    }

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
      const restoredVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.1;
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
    setActiveSceneAudioSourceId(null);
    notify("neutral", "Прогресс сброшен", "Можно начать квест заново.");
  }

  function handleStartQuest() {
    if (isIntroTransitioning) return;

    setIsIntroTransitioning(true);
    window.setTimeout(() => {
      setScreen(state.done ? "done" : "quest");
      setIsIntroTransitioning(false);
    }, 360);
  }

  function handleFinishHonorable() {
    if (isHonorableExiting) return;

    playUiSound("skip");
    setIsHonorableExiting(true);
    window.setTimeout(() => {
      setScreen("credits");
      setIsHonorableExiting(false);
    }, 420);
  }

  return (
    <div className={`appShell effects-${effectsMode}`}>
      <div className="bg">
        <div className="bgNoise" />
        <div className="aurora auroraPrimary" />
        <div className="aurora auroraSecondary" />
        <div className="aurora auroraAccent" />
        <SakuraPetalsBackground variant={screen === "intro" ? "hero" : "ambient"} />
        <div ref={mouseGlowRef} className="mouseGlow" />
        <div className="grid" />
        <div className="vignette" />

        {backgroundAudioSrc && (
          <audio
            ref={audioRef}
            src={backgroundAudioSrc}
            preload="auto"
            autoPlay
            onEnded={handleNextTrack}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}

        {screen !== "intro" && screen !== "honorable" && (
          <div className="floatingPlayer glowPanel">
            <button className="audioToggle trackStepButton" type="button" onClick={handlePreviousTrack} aria-label="РџСЂРµРґС‹РґСѓС‰РёР№ С‚СЂРµРє">
              <TrackStepIcon direction="previous" />
            </button>
            <button className="audioToggle" type="button" onClick={toggleAudio} aria-label={isPlaying ? "Пауза" : "Воспроизвести"}>
              <AudioPlayIcon playing={isPlaying} />
            </button>
            <button className="audioToggle trackStepButton" type="button" onClick={handleNextTrack} aria-label="РЎР»РµРґСѓСЋС‰РёР№ С‚СЂРµРє">
              <TrackStepIcon direction="next" />
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

        {cinematicPause && (
          <div
            className="cinematicPauseOverlay"
            style={{ "--cinematic-pause-duration": `${cinematicPause.durationMs}ms` } as CSSProperties}
            aria-hidden="true"
          >
            <div className="cinematicPauseVeil" />
            <div className="cinematicPauseCopy">
              <div className="cinematicPauseKicker">{cinematicPause.kicker}</div>
              <div className="cinematicPauseTitle">{cinematicPause.title}</div>
            </div>
          </div>
        )}

        <div className={`container ${screen === "intro" ? "container-intro" : ""} ${screen === "honorable" || screen === "credits" ? "container-finale" : ""}`}>
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
                onSceneAudioStateChange={setActiveSceneAudioSourceId}
              />
            </div>
          )}

          {screen === "honorable" && <HonorableMentionScene isExiting={isHonorableExiting} onSkip={handleFinishHonorable} />}

          {screen === "credits" && <CreditsScreen onComplete={() => setScreen("done")} />}

          {screen === "done" && (
            <section className="doneLayout glowPanel screenEnter">
              <div className="doneInner">
                <div className="sectionBadge">Личное послание</div>
                <h1 className="doneTitle">Для Марка, после титров.</h1>
                <p className="doneSubtitle">Финальная записка, которая остаётся уже после honorable mention, музыки и всего остального шума.</p>
                <div className="doneAccentLine" aria-hidden="true" />

                <div className="doneLetter">
                  <p className="doneParagraph">
                    Марк, это тестовый русский текст-заглушка для финального письма. Здесь потом может появиться настоящее личное послание, но уже сейчас экран должен ощущаться как тёплая пауза после всего квеста: без спешки, без служебного интерфейса, с красивой последней точкой.
                  </p>
                  <p className="doneParagraph">
                    Можно оставить здесь немного иронии, немного нежности и немного того спокойного финального света, который остаётся после хорошей сцены. Пусть это будет не технический экран завершения, а короткая записка, которую хочется дочитать до конца.
                  </p>
                </div>

                <p className="doneNote">С уважением к хорошему финалу и к человеку, ради которого всё это собиралось.</p>
                <div className="doneSignature">Тестовая подпись, которую потом можно заменить.</div>

                <div className="heroActions doneActions">
                  <button className="btn btn-primary finalPrimaryAction" type="button" onClick={handleReset}>
                    Вернуться в начало
                  </button>
                </div>
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

function TrackStepIcon({ direction }: { direction: "previous" | "next" }) {
  if (direction === "previous") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16.5 6.5C16.5 5.77 15.72 5.31 15.08 5.66L8.98 9.03C8.33 9.39 8.33 10.32 8.98 10.68L15.08 14.04C15.72 14.4 16.5 13.93 16.5 13.21V6.5Z" />
        <path d="M16.5 13.01C16.5 12.29 15.72 11.82 15.08 12.18L8.98 15.54C8.33 15.9 8.33 16.84 8.98 17.19L15.08 20.56C15.72 20.91 16.5 20.45 16.5 19.72V13.01Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 6.5C7.5 5.77 8.28 5.31 8.92 5.66L15.02 9.03C15.67 9.39 15.67 10.32 15.02 10.68L8.92 14.04C8.28 14.4 7.5 13.93 7.5 13.21V6.5Z" />
      <path d="M7.5 13.01C7.5 12.29 8.28 11.82 8.92 12.18L15.02 15.54C15.67 15.9 15.67 16.84 15.02 17.19L8.92 20.56C8.28 20.91 7.5 20.45 7.5 19.72V13.01Z" />
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
