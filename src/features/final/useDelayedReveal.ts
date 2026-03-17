import { useEffect, useState } from "react";

export function useDelayedReveal(delayMs: number) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);

    const timeoutId = window.setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs]);

  return visible;
}
