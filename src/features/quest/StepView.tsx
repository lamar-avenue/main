import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { MediaBlock, QuestStep } from "../../data/quest";
import { announceSceneAudioStart, subscribeToSceneAudioStart } from "../audio/sceneAudioBus";
import { isCorrect } from "./answer";
import { resolveMediaSrc } from "./media";
import { useIdleStepAudio } from "./useIdleStepAudio";

type FeedbackTone = "idle" | "success" | "error";
type ToastTone = "neutral" | "success" | "error";

type SceneAudioStateSetter = Dispatch<SetStateAction<string | null>>;
const ERROR_FEEDBACK_VARIANTS = ["Не-а", "Почти", "Слишком просто", "Попробуй ещё раз", "Подумай как Марк"] as const;
const EMPTY_ANSWER_MESSAGE = "Введите ответ или выберите один из вариантов.";
const WRONG_ANSWER_MESSAGE = "Ответ не совпал. Попробуй другой вариант.";
const IDLE_STATUS_LABEL = "Ждём ответ";
const SUCCESS_STATUS_LABEL = "Верно";
const ERROR_STATUS_LABEL = "Ответ не принят";
const IDLE_HINT_AUDIO_SRC = "/media/audio/ui/question-idle-hint.mp3";

export default function StepView({
  step,
  stepNumber,
  total,
  onSubmit,
  onReset,
  onToast,
  onSceneAudioStateChange,
}: {
  step: QuestStep;
  stepNumber: number;
  total: number;
  onSubmit: (value: string) => { ok: boolean; finished?: boolean };
  onReset: () => void;
  onToast: (tone: ToastTone, title: string, message: string) => void;
  onSceneAudioStateChange: SceneAudioStateSetter;
}) {
  const [value, setValue] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("idle");
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackAccent, setFeedbackAccent] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const errorFeedbackIndexRef = useRef(0);
  const inlineFeedbackId = useId();

  useEffect(() => {
    setValue("");
    setSelectedChoice(null);
    setFeedbackTone("idle");
    setShowHint(false);
    setIsSubmitting(false);
    setFeedbackAccent(null);
    setFeedbackMessage("");
    onSceneAudioStateChange(null);
  }, [onSceneAudioStateChange, step.id]);

  const answerModeLabel = step.answerMode ?? "exact";
  const progressPercent = Math.round((stepNumber / total) * 100);
  const feedbackLabel =
    feedbackTone === "idle" ? IDLE_STATUS_LABEL : feedbackTone === "success" ? SUCCESS_STATUS_LABEL : ERROR_STATUS_LABEL;
  const isOrdinaryTextQuestion = !step.blocks?.some((block) => block.type !== "text");
  const stepAnswerPreview = useMemo(() => {
    if (answerModeLabel === "keywords") {
      return step.keywords?.join(" + ") ?? "набор ключевых слов";
    }

    return Array.isArray(step.answer) ? step.answer.join(" / ") : step.answer;
  }, [answerModeLabel, step.answer, step.keywords]);
  const { audioRef: idleAudioRef, registerActivity: registerIdleActivity } = useIdleStepAudio({
    enabled: isOrdinaryTextQuestion,
    stepId: step.id,
    onSceneAudioStateChange,
  });

  function getNextErrorAccent() {
    const accent = ERROR_FEEDBACK_VARIANTS[errorFeedbackIndexRef.current % ERROR_FEEDBACK_VARIANTS.length];
    errorFeedbackIndexRef.current += 1;
    return accent;
  }

  function showError(message: string, accent: string = getNextErrorAccent()) {
    setFeedbackTone("error");
    setFeedbackAccent(accent);
    setFeedbackMessage(message);
    onToast("error", accent, message);
  }

  function submitValue(nextValue: string) {
    if (isSubmitting) return;

    const trimmed = nextValue.trim();
    setSelectedChoice(nextValue);
    setValue(nextValue);

    if (!trimmed) {
      showError(EMPTY_ANSWER_MESSAGE, "Нужен ответ");
      return;
    }

    const ok = isCorrect(nextValue, step);
    if (!ok) {
      showError(WRONG_ANSWER_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    setFeedbackTone("success");
    setFeedbackAccent("Ответ принят");
    setFeedbackMessage("Верный ответ. Переходим к следующему шагу.");
    onToast("success", "Верно", "Переходим к следующему шагу.");

    window.requestAnimationFrame(() => {
      onSubmit(nextValue);
    });
  }

  return (
    <section
      className="questLayout"
      onPointerDownCapture={registerIdleActivity}
      onKeyDownCapture={registerIdleActivity}
      onInputCapture={registerIdleActivity}
      onFocusCapture={registerIdleActivity}
    >
      <div className="questMain glowPanel">
        <div className="questionHeader">
          <div>
            <div className="sectionBadge">Шаг {stepNumber}</div>
            <h1 className="questionTitle">{step.title}</h1>
          </div>
          <div className="questionMeta">
            <span className={`statusPill is-${feedbackTone}`}>{feedbackLabel}</span>
            <span className="modePill">{answerModeLabel}</span>
          </div>
        </div>

        <div className="progressHeader">
          <div className="progressTrack">
            <div className="progressValue" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="progressLabel">{progressPercent}% синхронизировано</span>
        </div>

        <div className="questionIntro glowInset">
          <p className="subtitle">{step.prompt}</p>
        </div>

        {step.blocks && step.blocks.length > 0 && (
          <div className="mediaGrid">
            {step.blocks.map((block, index) => (
              <Media
                key={index}
                block={block}
                cinematic={step.answerMode === "keywords"}
                onSceneAudioStateChange={onSceneAudioStateChange}
              />
            ))}
          </div>
        )}

        {step.choices && step.choices.length > 0 && (
          <div className="choiceGrid">
            {step.choices.map((choice, index) => {
              const isSelected = selectedChoice === choice;
              const choiceState =
                isSelected && feedbackTone !== "idle" ? `is-${feedbackTone}` : isSelected ? "is-selected" : "";

              return (
                <button
                  key={choice}
                  className={`choiceCard ${choiceState}`}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => submitValue(choice)}
                >
                  <span className="choiceIndex">{String(index + 1).padStart(2, "0")}</span>
                  <span className="choiceText">{choice}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="inputPanel glowInset">
          <div className="fieldLabel">Ручной ввод</div>
          <div className="field">
            <input
              className="input"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setSelectedChoice(null);
                setFeedbackTone("idle");
                setFeedbackAccent(null);
                setFeedbackMessage("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitValue(value);
                }
              }}
              placeholder="Введите ответ вручную"
              autoFocus
              aria-invalid={feedbackTone === "error"}
              aria-describedby={feedbackMessage ? inlineFeedbackId : undefined}
            />
            <button className="btn btn-primary" type="button" disabled={isSubmitting} onClick={() => submitValue(value)}>
              Проверить
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setShowHint((current) => !current)}>
              {showHint ? "Скрыть подсказку" : "Показать подсказку"}
            </button>
          </div>
          {feedbackMessage && (
            <div
              id={inlineFeedbackId}
              className={`inlineFeedback is-${feedbackTone}`}
              role={feedbackTone === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              <span className="inlineFeedbackBadge">{feedbackAccent ?? feedbackLabel}</span>
              <span className="inlineFeedbackText">{feedbackMessage}</span>
            </div>
          )}
        </div>

        {showHint && step.hint && (
          <div className="hintCard glowInset">
            <div className="sectionBadge">Подсказка</div>
            <p>{step.hint}</p>
          </div>
        )}

        {isOrdinaryTextQuestion && (
          <audio ref={idleAudioRef} className="mediaAudio mediaAudioElement" preload="metadata" src={resolveMediaSrc(IDLE_HINT_AUDIO_SRC)} />
        )}
      </div>

      <aside className="questSidebar glowPanel">
        <div className="sectionBadge">Шифр / прогресс</div>
        <div className="sidebarValue">
          {String(stepNumber).padStart(2, "0")}
          <span>/ {String(total).padStart(2, "0")}</span>
        </div>
        <div className="sidebarProgress">
          <div className="sidebarProgressValue" style={{ height: `${progressPercent}%` }} />
        </div>
        <div className="sidebarMeta glowInset">
          <div className="systemRow">
            <span>Проверка</span>
            <strong>{answerModeLabel}</strong>
          </div>
          <div className="systemRow">
            <span>Эталон</span>
            <strong>{stepAnswerPreview}</strong>
          </div>
          <div className="systemRow">
            <span>Подсказка</span>
            <strong>{step.hint ? "Доступна" : "Скрыта"}</strong>
          </div>
        </div>
        <div className="cipherPanel glowInset">
          <div className="cipherLine" />
          <div className="cipherGlyphs">AX-17 // ORBIT // VEIL // SIGNAL</div>
          <div className="cipherLine" />
        </div>
        <button className="btn btn-secondary sidebarReset" type="button" onClick={onReset}>
          Сбросить квест
        </button>
      </aside>
    </section>
  );
}

function Media({
  block,
  cinematic,
  onSceneAudioStateChange,
}: {
  block: MediaBlock;
  cinematic: boolean;
  onSceneAudioStateChange: SceneAudioStateSetter;
}) {
  switch (block.type) {
    case "text":
      return (
        <div className="mediaCard glowInset">
          <div className="mediaText">{block.value}</div>
        </div>
      );

    case "image":
      return (
        <div className="mediaCard glowInset">
          <img className="mediaImg" src={resolveMediaSrc(block.src)} alt={block.alt ?? ""} />
        </div>
      );

    case "audio":
      return <SceneAudioMedia block={block} onSceneAudioStateChange={onSceneAudioStateChange} />;

    case "video":
      return <VideoMedia block={block} cinematic={cinematic} onSceneAudioStateChange={onSceneAudioStateChange} />;

    case "youtube":
      return (
        <div className="mediaCard glowInset">
          {block.title && <div className="mediaTitle">{block.title}</div>}
          <div className="ytWrap">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${block.id}`}
              title={block.title ?? "YouTube"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
  }
}

function SceneAudioMedia({
  block,
  onSceneAudioStateChange,
}: {
  block: Extract<MediaBlock, { type: "audio" }>;
  onSceneAudioStateChange: SceneAudioStateSetter;
}) {
  const sourceId = useId();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousVolumeRef = useRef(0.82);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.82);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.muted = volume === 0;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      announceSceneAudioStart(sourceId);
      setIsPlaying(true);
      onSceneAudioStateChange(sourceId);
    };

    const handleStop = () => {
      setIsPlaying(false);
      onSceneAudioStateChange((current) => (current === sourceId ? null : current));
    };

    const unsubscribe = subscribeToSceneAudioStart(sourceId, () => {
      audio.pause();
    });

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handleStop);
    audio.addEventListener("ended", handleStop);

    return () => {
      unsubscribe();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handleStop);
      audio.removeEventListener("ended", handleStop);
      audio.pause();
      onSceneAudioStateChange((current) => (current === sourceId ? null : current));
    };
  }, [onSceneAudioStateChange, sourceId]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      announceSceneAudioStart(sourceId);

      try {
        await audio.play();
      } catch {
        return;
      }

      return;
    }

    audio.pause();
  }

  function handleVolumeChange(nextVolume: number) {
    setVolume(nextVolume);
    if (nextVolume > 0) {
      previousVolumeRef.current = nextVolume;
    }
  }

  function toggleMute() {
    if (volume === 0) {
      setVolume(previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.82);
      return;
    }

    previousVolumeRef.current = volume;
    setVolume(0);
  }

  return (
    <div className="mediaCard glowInset">
      {block.title && <div className="mediaTitle">{block.title}</div>}
      <div className="sceneAudioControl">
        <button className="audioToggle" type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pause scene audio" : "Play scene audio"}>
          <AudioPlayIcon playing={isPlaying} />
        </button>
        <button
          className={`audioMuteButton ${volume === 0 ? "is-muted" : ""}`}
          type="button"
          onClick={toggleMute}
          aria-label={volume === 0 ? "Unmute scene audio" : "Mute scene audio"}
        >
          <AudioVolumeIcon muted={volume === 0} />
        </button>
        <input
          className="slider volumeSlider sceneVolumeSlider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => handleVolumeChange(Number(event.target.value))}
          aria-label="Scene audio volume"
        />
      </div>
      <div className="sceneAudioMeta">
        <span className="sceneAudioLabel">Scene audio</span>
        <span className="sceneAudioStatus">{isPlaying ? "Playing" : "Paused"}</span>
      </div>
      <audio ref={audioRef} className="mediaAudio mediaAudioElement" preload="metadata" src={resolveMediaSrc(block.src)} />
    </div>
  );
}

function VideoMedia({
  block,
  cinematic,
  onSceneAudioStateChange,
}: {
  block: Extract<MediaBlock, { type: "video" }>;
  cinematic: boolean;
  onSceneAudioStateChange: SceneAudioStateSetter;
}) {
  const sourceId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPausedAtDecision, setIsPausedAtDecision] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      announceSceneAudioStart(sourceId);
      onSceneAudioStateChange(sourceId);
    };

    const handleStop = () => {
      onSceneAudioStateChange((current) => (current === sourceId ? null : current));
    };

    const unsubscribe = subscribeToSceneAudioStart(sourceId, () => {
      video.pause();
    });

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handleStop);
    video.addEventListener("ended", handleStop);

    return () => {
      unsubscribe();
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handleStop);
      video.removeEventListener("ended", handleStop);
      onSceneAudioStateChange((current) => (current === sourceId ? null : current));
    };
  }, [onSceneAudioStateChange, sourceId]);

  useEffect(() => {
    const video = videoRef.current;
    const pauseAt = block.pauseAt;
    if (!video || pauseAt == null) return;

    setIsPausedAtDecision(false);
    video.currentTime = 0;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        setIsPausedAtDecision(true);
      }
    };

    const handleTimeUpdate = () => {
      if (video.currentTime >= pauseAt) {
        video.pause();
        setIsPausedAtDecision(true);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    void tryPlay();

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [block.pauseAt, block.src]);

  return (
    <div className={`mediaCard glowInset ${cinematic ? "decisionCard" : ""} ${isPausedAtDecision ? "is-decision" : ""}`}>
      {block.title && <div className="mediaTitle">{block.title}</div>}
      <div className="videoStage">
        <video
          ref={videoRef}
          className="mediaVideo"
          controls
          preload="metadata"
          src={resolveMediaSrc(block.src)}
          poster={block.poster ? resolveMediaSrc(block.poster) : undefined}
        />
        {cinematic && isPausedAtDecision && (
          <div className="decisionOverlay">
            <span className="overlayChip">Точка выбора</span>
            <span className="overlayText">Видео остановлено на ключевом моменте. Выбери, что будет дальше.</span>
          </div>
        )}
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
