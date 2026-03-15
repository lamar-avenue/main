import type { QuestStep } from "../../data/quest";

export function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\u0451/g, "\u0435")
    .replace(/\s+/g, " ");
}

function toArray(value: string | string[]) {
  return Array.isArray(value) ? value : [value];
}

export function isCorrect(input: string, step: QuestStep) {
  const normalizedInput = normalize(input);
  const mode = step.answerMode ?? "exact";

  if (!normalizedInput) return false;

  if (mode === "exact") {
    return toArray(step.answer).some((answer) => normalize(answer) === normalizedInput);
  }

  if (mode === "contains") {
    return toArray(step.answer).some((answer) => normalizedInput.includes(normalize(answer)));
  }

  const keywords = (step.keywords ?? []).map(normalize).filter(Boolean);
  if (keywords.length === 0) return false;

  return keywords.every((keyword) => normalizedInput.includes(keyword));
}
