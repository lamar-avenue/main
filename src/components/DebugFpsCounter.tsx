import { useEffect, useRef } from "react";

const SAMPLE_WINDOW_MS = 750;

export default function DebugFpsCounter() {
  const fpsRef = useRef<HTMLSpanElement | null>(null);
  const msRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let frameId = 0;
    let lastTimestamp = performance.now();
    let windowStart = lastTimestamp;
    let framesInWindow = 0;
    let frameTimeTotal = 0;

    const tick = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      framesInWindow += 1;
      frameTimeTotal += delta;

      const elapsed = timestamp - windowStart;
      if (elapsed >= SAMPLE_WINDOW_MS) {
        const fps = elapsed > 0 ? (framesInWindow * 1000) / elapsed : 0;
        const msPerFrame = framesInWindow > 0 ? frameTimeTotal / framesInWindow : 0;

        if (fpsRef.current) {
          fpsRef.current.textContent = `FPS: ${Math.round(fps)}`;
        }

        if (msRef.current) {
          msRef.current.textContent = `${msPerFrame.toFixed(1)}ms`;
        }

        windowStart = timestamp;
        framesInWindow = 0;
        frameTimeTotal = 0;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="debugFpsCounter" aria-hidden="true">
      <span ref={fpsRef}>FPS: 0</span>
      <span ref={msRef}>0.0ms</span>
    </div>
  );
}
