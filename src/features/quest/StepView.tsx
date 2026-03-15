import { useState } from "react";
import type { QuestStep } from "../../data/quest";
import type { MediaBlock } from "../../data/quest";

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

  return (
    <>
      <div className="kicker">
        STEP {stepNumber} / {total}
      </div>
      <h1 className="title">{step.title}</h1>
	  {step.blocks && step.blocks.length > 0 && (
  <div className="media">
    {step.blocks.map((b, i) => (
      <Media key={i} block={b} />
    ))}
  </div>
)}
      <p className="subtitle">{step.prompt}</p>

      <div className="field">
        <input
		onKeyDown={(e) => {
  if (e.key === "Enter") {
    const res = onSubmit(value);
    if (!res.ok) setError("Не то. Попробуй ещё раз.");
    else {
      setValue("");
      setError(null);
    }
  }
}}
          className="input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="Ввод…"
          autoFocus
        />
        <button
          className="btn"
          onClick={() => {
            const res = onSubmit(value);
            if (!res.ok) setError("Не то. Попробуй ещё раз.");
            else {
              setValue("");
              setError(null);
            }
          }}
        >
          Проверить
        </button>
        <button className="btn ghost" onClick={() => setShowHint((v) => !v)}>
          Подсказка
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showHint && step.hint && <div className="hint">{step.hint}</div>}

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn ghost" onClick={onReset}>
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
      return (
        <img className="mediaImg" src={block.src} alt={block.alt ?? ""} />
      );

    case "audio":
      return (
        <div className="mediaBox">
          {block.title && <div className="mediaTitle">{block.title}</div>}
          <audio controls preload="none" src={block.src} />
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
            src={block.src}
            poster={block.poster}
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