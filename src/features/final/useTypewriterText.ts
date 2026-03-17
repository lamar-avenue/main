import { useEffect, useState } from "react";

type TypewriterResult = {
  text: string;
  isComplete: boolean;
};

export function useTypewriterText(fullText: string): TypewriterResult {
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    setVisibleLength(0);

    let timeoutId: number | undefined;
    let cancelled = false;

    const tick = (nextLength: number) => {
      if (cancelled) return;

      setVisibleLength(nextLength);
      if (nextLength >= fullText.length) return;

      const currentChar = fullText[nextLength];
      const delay = /[.!?]/.test(currentChar) ? 84 : /[,;:]/.test(currentChar) ? 42 : currentChar === " " ? 14 : 24;

      timeoutId = window.setTimeout(() => {
        tick(nextLength + 1);
      }, delay);
    };

    timeoutId = window.setTimeout(() => {
      tick(1);
    }, 180);

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [fullText]);

  return {
    text: fullText.slice(0, visibleLength),
    isComplete: visibleLength >= fullText.length,
  };
}
