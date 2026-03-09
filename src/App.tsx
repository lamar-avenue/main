import { useState } from "react";
import { useQuest } from "./features/quest/useQuest";
import StepView from "./features/quest/StepView";

export default function App() {
  const [screen, setScreen] = useState<"intro" | "quest" | "done">("intro");
  const { step, submit, reset, state, total } = useQuest();

  return (
    <div className="bg">
      <div className="aurora" />
      <div className="grid" />
      <div className="vignette" />

      <div className="container">
        <div className="glass">
          {screen === "intro" && (
            <>
              <div className="kicker">QUEST FOR MARK</div>
              <h1 className="title">Cinematic Start</h1>
              <p className="subtitle">
                Нажми «Начать» — и пойдём по шагам. Прогресс сохраняется автоматически.
              </p>

              <div className="row">
                <button className="btn" onClick={() => setScreen("quest")}>
                  Начать
                </button>
                <button
                  className="btn ghost"
                  onClick={() => {
                    reset();
                    alert("Прогресс сброшен");
                  }}
                >
                  Сброс
                </button>
              </div>

              <div className="fineprint">
                прогресс: {state.done ? "готово" : `шаг ${state.index + 1}/${total}`}
              </div>
            </>
          )}

          {screen === "quest" && step && !state.done && (
            <StepView
              step={step}
              stepNumber={state.index + 1}
              total={total}
              onSubmit={(v) => {
                const res = submit(v);
                if (res.ok && res.finished) setScreen("done");
                return res;
              }}
              onReset={() => {
                reset();
                setScreen("intro");
              }}
            />
          )}

          {screen === "done" && (
            <>
			<div className="hint" style={{ marginTop: 12 }}>
  Подарок: <a href="https://example.com" target="_blank">открыть</a>
</div>
              <div className="kicker">COMPLETE</div>
              <h1 className="title">Ты прошёл квест 🎉</h1>
              <p className="subtitle">
                Это финальный экран. Дальше сюда добавим “подарок” — ссылку, код, видео или что
                угодно.
              </p>

              <div className="row">
                <button
                  className="btn"
                  onClick={() => {
                    reset();
                    setScreen("intro");
                  }}
                >
                  Начать заново
                </button>
              </div>

              <div className="fineprint">сделано для Марка</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}