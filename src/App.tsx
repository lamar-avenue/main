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
        title: "Смотри внимательнее",
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
  const [isMuted, setIsMuted] = useState(false);
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
  const previousBackgroundAudioSrcRef = useRef<string | null>(null);
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
  const isEffectivelyMuted = isMuted || volume === 0;
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
    audio.muted = isEffectivelyMuted;
  }, [isEffectivelyMuted, volume]);

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

    if (!resumeBackgroundAfterSuppressionRef.current || (volume <= 0 && !isMuted)) {
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
  }, [isBackgroundSuppressed, isMuted, isPlaying, volume]);

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

    if (previousBackgroundAudioSrcRef.current === backgroundAudioSrc) {
      return;
    }

    previousBackgroundAudioSrcRef.current = backgroundAudioSrc;
    audio.load();
    audio.volume = volume;
    audio.muted = isEffectivelyMuted;

    if (!pendingTrackAutoplayRef.current || isBackgroundSuppressed || (volume <= 0 && !isMuted)) {
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
  }, [backgroundAudioSrc, isBackgroundSuppressed, isEffectivelyMuted, isMuted, volume]);

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
    const audio = audioRef.current;

    setVolume(nextVolume);
    if (nextVolume > 0) {
      previousVolumeRef.current = nextVolume;
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }

    if (audio) {
      audio.volume = nextVolume;
      audio.muted = nextVolume === 0;
    }
  }

  function toggleMute() {
    const audio = audioRef.current;

    if (isEffectivelyMuted) {
      const restoredVolume = volume > 0 ? volume : previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.1;
      if (volume === 0) {
        setVolume(restoredVolume);
      }
      setIsMuted(false);

      if (audio) {
        audio.volume = volume === 0 ? restoredVolume : volume;
        audio.muted = false;
      }
      return;
    }

    previousVolumeRef.current = volume;
    setIsMuted(true);

    if (audio) {
      audio.muted = true;
    }
  }

  function handleReset() {
    previousDoneRef.current = false;
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
      previousDoneRef.current = false;
      reset();
      setToast(null);
      setActiveSceneAudioSourceId(null);
      setScreen("quest");
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
    <div className={`appShell effects-${effectsMode} ${screen === "quest" ? "is-quest-screen" : ""}`}>
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
            <button className="audioToggle trackStepButton" type="button" onClick={handlePreviousTrack} aria-label="Предыдущий трек">
              <TrackStepIcon direction="previous" />
            </button>
            <button className={`audioToggle audioPlayButton ${isPlaying ? "is-active" : ""}`} type="button" onClick={toggleAudio} aria-label={isPlaying ? "Пауза" : "Воспроизвести"}>
              <AudioPlayIcon playing={isPlaying} />
            </button>
            <button className="audioToggle trackStepButton" type="button" onClick={handleNextTrack} aria-label="Следующий трек">
              <TrackStepIcon direction="next" />
            </button>
            <button
              className={`audioMuteButton ${isEffectivelyMuted ? "is-muted" : "is-active"}`}
              type="button"
              onClick={toggleMute}
              aria-label={isEffectivelyMuted ? "Включить звук" : "Выключить звук"}
            >
              <AudioVolumeIcon muted={isEffectivelyMuted} />
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

        <div
          className={`container ${screen === "intro" ? "container-intro" : ""} ${screen === "quest" ? "container-quest" : ""} ${screen === "honorable" || screen === "credits" ? "container-finale" : ""}`}
        >
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
        <path d="M8 6.75V17.25" />
        <path d="M17 7.15L10.7 11.33C10.3 11.59 10.3 12.17 10.7 12.44L17 16.6V7.15Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 6.75V17.25" />
      <path d="M7 7.15L13.3 11.33C13.7 11.59 13.7 12.17 13.3 12.44L7 16.6V7.15Z" />
    </svg>
  );
}

function AudioVolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.75 10.55H7.95L12.05 7.2C12.52 6.82 13.25 7.15 13.25 7.75V16.25C13.25 16.85 12.52 17.18 12.05 16.8L7.95 13.45H4.75C4.34 13.45 4 13.11 4 12.7V11.3C4 10.89 4.34 10.55 4.75 10.55Z" />
      {muted ? (
        <>
          <path d="M16.75 9.1L20.5 14.9" />
          <path d="M20.5 9.1L16.75 14.9" />
        </>
      ) : (
        <>
          <path d="M16.8 9.55C17.72 10.31 18.25 11.35 18.25 12.5C18.25 13.65 17.72 14.69 16.8 15.45" />
          <path d="M18.75 7.5C20.21 8.83 21 10.58 21 12.5C21 14.42 20.21 16.17 18.75 17.5" />
        </>
      )}
    </svg>
  );
}
