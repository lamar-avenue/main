import { useEffect, useState } from "react";

type Sample = {
  fps: number;
  msPerFrame: number;
};

const SAMPLE_WINDOW_MS = 750;

export default function DebugFpsCounter() {
  const [sample, setSample] = useState<Sample>({ fps: 0, msPerFrame: 0 });

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

        setSample({
          fps: Math.round(fps),
          msPerFrame: Number(msPerFrame.toFixed(1)),
        });

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
      <span>FPS: {sample.fps}</span>
      <span>{sample.msPerFrame.toFixed(1)}ms</span>
    </div>
  );
}
