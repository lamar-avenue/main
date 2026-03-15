export type MediaBlock =
  | { type: "text"; value: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "audio"; src: string; title?: string }
  | { type: "video"; src: string; title?: string; poster?: string }
  | { type: "youtube"; id: string; title?: string };
  
  export type QuestStep = {
  id: string;
  title: string;
  blocks?: MediaBlock[];
  prompt: string;

  answerMode?: "exact" | "contains" | "keywords"; // NEW
  answer: string | string[];                      // как и было
  keywords?: string[];                            // NEW (для keywords)

  hint?: string;
};

export type QuestStep = {
  id: string;
  title: string;
  blocks?: MediaBlock[];     // вот сюда кладём картинку/музыку/видео/текст
  prompt: string;            // сам вопрос
  answer: string | string[]; // ответы (варианты)
  hint?: string;
};

export const quest: QuestStep[] = [
  {
    id: "1",
    title: "Шаг 1 — Разминка",
    blocks: [{ type: "text", value: "Добро пожаловать. Это тестовый шаг." }],
    prompt: "Введи кодовое слово:",
    answer: ["mark", "марко", "марк"],
    hint: "Подсказка: имя.",
  },

  {
    id: "2",
    title: "Шаг 2 — Картинка",
    blocks: [{ type: "image", src: "/media/step2.jpg", alt: "Шаг 2" }],
    prompt: "Что изображено на картинке? (одно слово)",
    answer: ["машина", "car"],
  },

  {
    id: "3",
    title: "Шаг 3 — Музыка",
    blocks: [{ type: "audio", src: "/media/step3.mp3", title: "Трек" }],
    prompt: "Какое настроение у трека? (одно слово)",
    answer: ["грусть", "радость", "тревога"],
  },

  {
    id: "4",
    title: "Шаг 4 — Видео",
    blocks: [{ type: "video", src: "/media/step4.mp4", title: "Сцена" }],
    prompt: "Что будет на видео дальше? (коротко)",
    answer: ["он повернет", "он повернёт", "поворот"],
    hint: "Смотри на движение камеры.",
  },
];