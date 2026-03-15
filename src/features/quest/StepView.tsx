import { useEffect, useMemo, useState } from "react";
import type { MediaBlock, QuestStep } from "../../data/quest";
import { isCorrect } from "./answer";
import { resolveMediaSrc } from "./media";

type FeedbackTone = "idle" | "success" | "error";

export default function StepView({
  step,
  stepNumber,
  total,
  onSubmit,
  onReset,
}: {
  step: QuestStep;
  stepNumber: number;
  total: number;
  onSubmit: (value: string) => { ok: boolean; finished?: boolean };
  onReset: () => void;
}) {
  const [value, setValue] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("idle");
  const [notice, setNotice] = useState<{ tone: Exclude<FeedbackTone, "idle">; title: string; message: string } | null>(
    null,
  );
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValue("");
    setSelectedChoice(null);
    setFeedbackTone("idle");
    setNotice(null);
    setShowHint(false);
    setIsSubmitting(false);
  }, [step.id]);

  useEffect(() => {
    if (!notice || notice.tone === "success") return;

    const timeoutId = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const answerModeLabel = step.answerMode ?? "exact";
  const progressPercent = Math.round((stepNumber / total) * 100);
  const stepAnswerPreview = useMemo(() => {
    if (answerModeLabel === "keywords") {
      return step.keywords?.join(" + ") ?? "keyword set";
    }

    return Array.isArray(step.answer) ? step.answer.join(" / ") : step.answer;
  }, [answerModeLabel, step.answer, step.keywords]);

  function showError(message: string) {
    setFeedbackTone("error");
    setNotice({
      tone: "error",
      title: "Access denied",
      message,
    });
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
      showError("Ответ не совпал с текущим паттерном. Попробуй другой вариант.");
      return;
    }

    setIsSubmitting(true);
    setFeedbackTone("success");
    setNotice({
      tone: "success",
      title: "Access granted",
      message: "Совпадение подтверждено. Открываем следующий шаг.",
    });

    window.setTimeout(() => {
      onSubmit(nextValue);
    }, 220);
  }

  return (
    <section className="questLayout">
      <div className="questMain glowPanel">
        <div className="questionHeader">
          <div>
            <div className="sectionBadge">Step {stepNumber}</div>
            <h1 className="questionTitle">{step.title}</h1>
          </div>
          <div className="questionMeta">
            <span className={`statusPill is-${feedbackTone}`}>{feedbackTone === "idle" ? "Awaiting input" : feedbackTone}</span>
            <span className="modePill">{answerModeLabel}</span>
          </div>
        </div>

        <div className="progressHeader">
          <div className="progressTrack">
            <div className="progressValue" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="progressLabel">{progressPercent}% synchronized</span>
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

        {notice && (
          <div className={`toastCard tone-${notice.tone}`}>
            <div className="toastPulse" />
            <div>
              <div className="toastTitle">{notice.title}</div>
              <div className="toastText">{notice.message}</div>
            </div>
          </div>
        )}

        {step.choices && step.choices.length > 0 && (
          <div className="choiceGrid">
            {step.choices.map((choice) => {
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
                  <span className="choiceIndex">{String(step.choices!.indexOf(choice) + 1).padStart(2, "0")}</span>
                  <span className="choiceText">{choice}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="inputPanel glowInset">
          <div className="fieldLabel">Manual input</div>
          <div className="field">
            <input
              className="input"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setSelectedChoice(null);
                setFeedbackTone("idle");
                setNotice(null);
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
              Verify response
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setShowHint((current) => !current)}>
              {showHint ? "Hide hint" : "Show hint"}
            </button>
          </div>
        </div>

        {showHint && step.hint && (
          <div className="hintCard glowInset">
            <div className="sectionBadge">Hint channel</div>
            <p>{step.hint}</p>
          </div>
        )}
      </div>

      <aside className="questSidebar glowPanel">
        <div className="sectionBadge">Cipher / progress</div>
        <div className="sidebarValue">
          {String(stepNumber).padStart(2, "0")}
          <span>/ {String(total).padStart(2, "0")}</span>
        </div>
        <div className="sidebarProgress">
          <div className="sidebarProgressValue" style={{ height: `${progressPercent}%` }} />
        </div>
        <div className="sidebarMeta glowInset">
          <div className="systemRow">
            <span>Validation</span>
            <strong>{answerModeLabel}</strong>
          </div>
          <div className="systemRow">
            <span>Reference</span>
            <strong>{stepAnswerPreview}</strong>
          </div>
          <div className="systemRow">
            <span>Hint</span>
            <strong>{step.hint ? "Available" : "Hidden"}</strong>
          </div>
        </div>
        <div className="cipherPanel glowInset">
          <div className="cipherLine" />
          <div className="cipherGlyphs">AX-17 // ORBIT // VEIL // SIGNAL</div>
          <div className="cipherLine" />
        </div>
        <button className="btn btn-secondary sidebarReset" type="button" onClick={onReset}>
          Reset quest
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
            Your browser does not support audio playback.
          </audio>
        </div>
      );

    case "video":
      return (
        <div className={`mediaCard glowInset ${cinematic ? "decisionCard" : ""}`}>
          {block.title && <div className="mediaTitle">{block.title}</div>}
          <div className="decisionOverlay">
            {cinematic && (
              <>
                <span className="overlayChip">Decision moment</span>
                <span className="overlayText">Frame paused for prediction.</span>
              </>
            )}
          </div>
          <video
            className="mediaVideo"
            controls
            preload="metadata"
            src={resolveMediaSrc(block.src)}
            poster={block.poster ? resolveMediaSrc(block.poster) : undefined}
          />
        </div>
      );

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
