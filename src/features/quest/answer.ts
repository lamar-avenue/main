export function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/\s+/g, " ");
}

export function isCorrect(input: string, answer: string | string[]) {
  const a = Array.isArray(answer) ? answer : [answer];
  const n = normalize(input);
  return a.some((x) => normalize(x) === n);
}