import type { QuestStep } from "../../data/quest";

export function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/\s+/g, " ");
}

function toArray(x: string | string[]) {
  return Array.isArray(x) ? x : [x];
}

export function isCorrect(input: string, step: QuestStep) {
  const mode = step.answerMode ?? "exact";
  const n = normalize(input);

  // пустой ввод — сразу мимо
  if (!n) return false;

  if (mode === "exact") {
    return toArray(step.answer).some((a) => normalize(a) === n);
  }

  if (mode === "contains") {
    return toArray(step.answer).some((a) => n.includes(normalize(a)));
  }

  // keywords: все ключевые слова должны встретиться (как подстроки)
  const kws = (step.keywords ?? []).map(normalize).filter(Boolean);
  if (kws.length === 0) return false;

  return kws.every((kw) => n.includes(kw));
}