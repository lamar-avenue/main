import { useEffect, useMemo, useState } from "react";
import { quest } from "../../data/quest";
import { isCorrect } from "./answer";

const LS_KEY = "markquest.progress.v1";

type State = {
  index: number; // текущий шаг
  done: boolean;
};

function load(): State {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { index: 0, done: false };
    const parsed = JSON.parse(raw) as State;
    if (typeof parsed.index !== "number" || typeof parsed.done !== "boolean") {
      return { index: 0, done: false };
    }
    return parsed;
  } catch {
    return { index: 0, done: false };
  }
}

export function useQuest() {
  const [state, setState] = useState<State>(() => load());
  const step = useMemo(() => quest[state.index], [state.index]);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  function reset() {
    setState({ index: 0, done: false });
  }

  function submit(answerInput: string) {
    if (!step) return { ok: false };

    const ok = isCorrect(answerInput, step);
    if (!ok) return { ok: false };

    const nextIndex = state.index + 1;
    if (nextIndex >= quest.length) {
      setState({ index: state.index, done: true });
      return { ok: true, finished: true as const };
    }

    setState({ index: nextIndex, done: false });
    return { ok: true, finished: false as const };
  }

  return { state, step, reset, submit, total: quest.length };
}