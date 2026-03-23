export type MediaBlock =
  | { type: "text"; value: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "audio"; src: string; title?: string }
  | { type: "video"; src: string; title?: string; poster?: string; pauseAt?: number }
  | { type: "youtube"; id: string; title?: string };

export type QuestStep = {
  id: string;
  title: string;
  blocks?: MediaBlock[];
  prompt: string;
  answer: string | string[];
  answerMode?: "exact" | "contains" | "keywords";
  keywords?: string[];
  choices?: string[];
  hint?: string;
};

export const quest: QuestStep[] = [
  {
    id: "1",
    title: "Шаг 1 - Разминка",
    blocks: [{ type: "text", value: "Добро пожаловать. Это тестовый шаг." }],
    prompt: "Введи кодовое слово:",
    answer: ["mark", "марко", "марк"],
    choices: ["mark", "john", "hello"],
    hint: "Подсказка: имя.",
  },
  {
    id: "2",
    title: "Шаг 2 - Картинка",
    blocks: [{ type: "image", src: "/media/images/step2.jpg", alt: "Шаг 2" }],
    prompt: "Что изображено на картинке? (одно слово)",
    answerMode: "exact",
    answer: ["машина", "car"],
    choices: ["машина", "велосипед", "дом"],
  },
  {
    id: "3",
    title: "Шаг 3 - Музыка",
    blocks: [{ type: "audio", src: "/media/audio/scene/step3.mp3", title: "Трек" }],
    prompt: "Какое настроение у трека? (одно слово)",
    answerMode: "contains",
    answer: ["грусть", "радость", "тревога"],
    choices: ["чувствуется грусть", "яркая радость", "полная тревога"],
  },
  {
    id: "4",
    title: "Шаг 4 - Видео",
    blocks: [{ type: "video", src: "/media/video/step4.mp4", title: "Сцена", pauseAt: 2.8 }],
    prompt: "Что будет на видео дальше? (коротко)",
    answerMode: "keywords",
    answer: ["он повернет", "он повернёт", "поворот"],
    keywords: ["он", "повернет"],
    choices: ["он повернет направо", "он остановится", "будет поворот"],
    hint: "Смотри на движение камеры.",
  },
];
