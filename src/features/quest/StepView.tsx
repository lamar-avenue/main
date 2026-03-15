import { useEffect, useState } from "react";
import type { MediaBlock, QuestStep } from "../../data/quest";

function resolveMediaSrc(src: string) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;

  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedSrc = src.startsWith("/") ? src.slice(1) : src;

  return `${normalizedBase}${normalizedSrc}`;
}

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
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setValue("");
    setError(null);
    setShowHint(false);
  }, [step.id]);

  function submitValue(nextValue: string) {
    setValue(nextValue);

    const result = onSubmit(nextValue);
    if (!result.ok) {
      setError("Не то. Попробуй ещё раз.");
      return;
    }

    setValue("");
    setError(null);
  }

  return (
    <>
      <div className="kicker">
        STEP {stepNumber} / {total}
      </div>
      <h1 className="title">{step.title}</h1>

      {step.blocks && step.blocks.length > 0 && (
        <div className="media">
          {step.blocks.map((block, index) => (
            <Media key={index} block={block} />
          ))}
        </div>
      )}

      <p className="subtitle">{step.prompt}</p>

      {step.choices && step.choices.length > 0 && (
        <div className="row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          {step.choices.map((choice) => (
            <button
              key={choice}
              className="btn ghost"
              type="button"
              onClick={() => submitValue(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      <div className="field">
        <input
          className="input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submitValue(value);
            }
          }}
          placeholder="Ввод..."
          autoFocus
        />
        <button className="btn" type="button" onClick={() => submitValue(value)}>
          Проверить
        </button>
        <button className="btn ghost" type="button" onClick={() => setShowHint((current) => !current)}>
          Подсказка
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showHint && step.hint && <div className="hint">{step.hint}</div>}

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn ghost" type="button" onClick={onReset}>
          Сбросить прогресс
        </button>
      </div>
    </>
  );
}

function Media({ block }: { block: MediaBlock }) {
  switch (block.type) {
    case "text":
      return <div className="mediaText">{block.value}</div>;

    case "image":
      return <img className="mediaImg" src={resolveMediaSrc(block.src)} alt={block.alt ?? ""} />;

    case "audio":
      return (
        <div className="mediaBox">
          {block.title && <div className="mediaTitle">{block.title}</div>}
          <audio controls preload="metadata">
            <source src={resolveMediaSrc(block.src)} />
            Ваш браузер не поддерживает воспроизведение аудио.
          </audio>
        </div>
      );

    case "video":
      return (
        <div className="mediaBox">
          {block.title && <div className="mediaTitle">{block.title}</div>}
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
        <div className="mediaBox">
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
