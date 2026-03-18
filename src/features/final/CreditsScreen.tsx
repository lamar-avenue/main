import { useEffect, useLayoutEffect, useRef } from "react";

type CreditsScreenProps = {
  onComplete: () => void;
};

type CreditsSection = {
  title: string;
  entries: Array<{
    label: string;
    value: string | string[];
  }>;
};

const CREDITS: CreditsSection[] = [
  {
    title: "Финальные титры",
    entries: [
      {
        label: "Проект",
        value: "Финал квеста и последняя сцена после honorable mention",
      },
    ],
  },
  {
    title: "Идея",
    entries: [
      {
        label: "Концепция",
        value: "Личное путешествие, собранное в форму интерактивного финала",
      },
      {
        label: "Настроение",
        value: "Тёплая благодарность, кинематографичный ритм и спокойное завершение",
      },
    ],
  },
  {
    title: "Создание",
    entries: [
      {
        label: "Сценарий и структура",
        value: "Переход от honorable mention к длинному финальному послесловию",
      },
      {
        label: "Дизайн финала",
        value: "Чистый dark cinematic без лишнего шума и визуальной перегрузки",
      },
      {
        label: "Анимация титров",
        value: "Плавный вертикальный scroll снизу вверх в духе финальных титров фильма",
      },
    ],
  },
  {
    title: "С благодарностью",
    entries: [
      {
        label: "Главный адресат",
        value: "Тот, ради кого весь этот финал и был собран",
      },
      {
        label: "Особое упоминание",
        value: "Honorable mention, который заслужил отдельный кадр и отдельную паузу",
      },
    ],
  },
  {
    title: "После титров",
    entries: [
      {
        label: "Финальный статус",
        value: "Квест завершён. Финальный экран открыт. История дошла до конца.",
      },
    ],
  },
];

const MIN_DURATION_MS = 22000;
const MAX_DURATION_MS = 36000;
const PIXELS_PER_SECOND = 34;
const OUTRO_DELAY_MS = 900;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function CreditsScreen({ onComplete }: CreditsScreenProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rollRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const completeTimeoutRef = useRef<number | null>(null);
  const measureFrameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const roll = rollRef.current;
    const frame = frameRef.current;
    if (!viewport || !roll || !frame) return;

    const measure = () => {
      const startOffset = viewport.clientHeight;
      const endOffset = -roll.scrollHeight;
      const totalDistance = startOffset + roll.scrollHeight;
      const durationMs = clamp((totalDistance / PIXELS_PER_SECOND) * 1000, MIN_DURATION_MS, MAX_DURATION_MS);

      roll.classList.remove("is-running");
      roll.style.setProperty("--credits-start-offset", `${startOffset}px`);
      roll.style.setProperty("--credits-end-offset", `${endOffset}px`);
      roll.style.setProperty("--credits-duration", `${durationMs}ms`);
      roll.style.transform = `translate3d(0, ${startOffset}px, 0)`;

      if (measureFrameRef.current !== null) {
        window.cancelAnimationFrame(measureFrameRef.current);
      }

      measureFrameRef.current = window.requestAnimationFrame(() => {
        roll.classList.add("is-running");
      });
    };

    measure();
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      window.removeEventListener("resize", measure);
      if (measureFrameRef.current !== null) {
        window.cancelAnimationFrame(measureFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current !== null) {
        window.clearTimeout(completeTimeoutRef.current);
      }
    };
  }, []);

  function handleAnimationEnd() {
    if (completeTimeoutRef.current !== null) {
      window.clearTimeout(completeTimeoutRef.current);
    }

    completeTimeoutRef.current = window.setTimeout(() => {
      onComplete();
    }, OUTRO_DELAY_MS);
  }

  return (
    <section className="creditsScreen screenEnter">
      <div className="creditsGlow" aria-hidden="true" />

      <div ref={frameRef} className="creditsFrame">
        <div className="creditsHeader">
          <div className="creditsKicker">Финал</div>
          <p className="creditsLead">Финальные титры</p>
        </div>

        <div ref={viewportRef} className="creditsViewport">
          <div ref={rollRef} className="creditsRoll" onAnimationEnd={handleAnimationEnd}>
            {CREDITS.map((section) => (
              <div key={section.title} className="creditsSection">
                <div className="creditsSectionTitle">{section.title}</div>

                {section.entries.map((entry) => {
                  const lines = Array.isArray(entry.value) ? entry.value : [entry.value];

                  return (
                    <div key={`${section.title}-${entry.label}`} className="creditsBlock">
                      <div className="creditsLabel">{entry.label}</div>
                      <div className="creditsValueGroup">
                        {lines.map((line) => (
                          <div key={line} className="creditsValue">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="creditsOutro">
              <span>Конец показа</span>
              <span>Спасибо за просмотр</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
