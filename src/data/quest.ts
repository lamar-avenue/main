export type QuestStep = {
  id: string;
  title: string;
  prompt: string;
  answer: string | string[];
  hint?: string;
};

export const quest: QuestStep[] = [
  {
    id: "1",
    title: "Шаг 1",
    prompt: "Введи кодовое слово (тест):",
    answer: ["марко", "marko", "mark"],
    hint: "Подсказка: имя :)",
  },
  {
    id: "2",
    title: "Шаг 2",
    prompt: "Введи число (тест):",
    answer: ["42", "сорок два", "сорокдва"],
    hint: "Подсказка: ответ на всё.",
  },
];