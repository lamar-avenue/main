import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaBlock, QuestStep } from "../../data/quest";
import { isCorrect } from "./answer";
import { resolveMediaSrc } from "./media";

type FeedbackTone = "idle" | "success" | "error";
type ToastTone = "neutral" | "success" | "error";

export default function StepView({
  step,
  stepNumber,
  total,
  onSubmit,
  onReset,
  onToast,
}: {
  step: QuestStep;
  stepNumber: number;
  total: number;
  onSubmit: (value: string) => { ok: boolean; finished?: boolean };
  onReset: () => void;
  onToast: (tone: ToastTone, title: string, message: string) => void;
}) {
  const [value, setValue] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("idle");
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValue("");
    setSelectedChoice(null);
    setFeedbackTone("idle");
    setShowHint(false);
    setIsSubmitting(false);
  }, [step.id]);

  const answerModeLabel = step.answerMode ?? "exact";
  const progressPercent = Math.round((stepNumber / total) * 100);
  const feedbackLabel = feedbackTone === "idle" ? "Ждём ответ" : feedbackTone === "success" ? "Верно" : "Неверно";
  const stepAnswerPreview = useMemo(() => {
    if (answerModeLabel === "keywords") {
      return step.keywords?.join(" + ") ?? "набор ключевых слов";
    }

    return Array.isArray(step.answer) ? step.answer.join(" / ") : step.answer;
  }, [answerModeLabel, step.answer, step.keywords]);

  function showError(message: string) {
    setFeedbackTone("error");
    onToast("error", "Неверный ответ", message);
  }

  function submitValue(nextValue: string) {
    if (isSubmitting) return;

    const trimmed = nextValue.trim();
    setSelectedChoice(nextValue);
    setValue(nextValue);

    if (!trimmed) {
      showError("Введите ответ или выберите один из вариантов.");
      return;
    }

    const ok = isCorrect(nextValue, step);
    if (!ok) {
      showError("Попробуй другой вариант.");
      return;
    }

    setIsSubmitting(true);
    setFeedbackTone("success");
    onToast("success", "Верно", "Переходим к следующему шагу.");

    window.requestAnimationFrame(() => {
      onSubmit(nextValue);
    });
  }

  return (
    <section className="questLayout">
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
              <Media key={index} block={block} cinematic={step.answerMode === "keywords"} />
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
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitValue(value);
                }
              }}
              placeholder="Введите ответ вручную"
              autoFocus
            />
            <button className="btn btn-primary" type="button" disabled={isSubmitting} onClick={() => submitValue(value)}>
              Проверить
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setShowHint((current) => !current)}>
              {showHint ? "Скрыть подсказку" : "Показать подсказку"}
            </button>
          </div>
        </div>

        {showHint && step.hint && (
          <div className="hintCard glowInset">
            <div className="sectionBadge">Подсказка</div>
            <p>{step.hint}</p>
          </div>
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

function Media({ block, cinematic }: { block: MediaBlock; cinematic: boolean }) {
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
      return (
        <div className="mediaCard glowInset">
          {block.title && <div className="mediaTitle">{block.title}</div>}
          <audio className="mediaAudio" controls preload="metadata">
            <source src={resolveMediaSrc(block.src)} />
            Ваш браузер не поддерживает воспроизведение аудио.
          </audio>
        </div>
      );

    case "video":
      return <VideoMedia block={block} cinematic={cinematic} />;

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

function VideoMedia({
  block,
  cinematic,
}: {
  block: Extract<MediaBlock, { type: "video" }>;
  cinematic: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPausedAtDecision, setIsPausedAtDecision] = useState(false);

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
