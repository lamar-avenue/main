import { useEffect } from "react";

const CREDITS = [
  { label: "Автор идеи", value: "Тестовый автор праздничного квеста" },
  { label: "Сценарий", value: "Временный русский текст для финальных титров" },
  { label: "Дизайн", value: "Placeholder-композиция в духе кинематографичного финала" },
  { label: "Разработка", value: "Сцена credits с вертикальным scroll-эффектом" },
  { label: "Специальная благодарность", value: "Марк, хорошее настроение и легендарный honorable mention" },
];

export default function CreditsScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onComplete();
    }, 16000);

    return () => window.clearTimeout(timeoutId);
  }, [onComplete]);

  return (
    <section className="creditsScreen screenEnter">
      <div className="creditsGlow" aria-hidden="true" />
      <div className="creditsViewport">
        <div className="creditsRoll">
          <div className="creditsIntro">Финальные титры</div>
          {CREDITS.map((item) => (
            <div key={item.label} className="creditsBlock">
              <div className="creditsLabel">{item.label}</div>
              <div className="creditsValue">{item.value}</div>
            </div>
          ))}
          <div className="creditsOutro">Конец показа</div>
        </div>
      </div>
    </section>
  );
}
