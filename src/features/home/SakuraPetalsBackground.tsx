import type { CSSProperties } from "react";

const PETALS = [
  { left: "5%", size: 30, duration: 18, delay: -4, drift: 52, blur: 0.6, opacity: 0.74, depth: "front" },
  { left: "12%", size: 22, duration: 22, delay: -10, drift: 64, blur: 0, opacity: 0.68, depth: "mid" },
  { left: "19%", size: 26, duration: 20, delay: -7, drift: 38, blur: 0.3, opacity: 0.64, depth: "mid" },
  { left: "28%", size: 18, duration: 24, delay: -15, drift: 46, blur: 1.2, opacity: 0.46, depth: "back" },
  { left: "36%", size: 32, duration: 21, delay: -2, drift: 60, blur: 0.2, opacity: 0.72, depth: "front" },
  { left: "44%", size: 24, duration: 19, delay: -12, drift: 48, blur: 0.1, opacity: 0.76, depth: "mid" },
  { left: "52%", size: 20, duration: 23, delay: -5, drift: 54, blur: 1.4, opacity: 0.5, depth: "back" },
  { left: "58%", size: 28, duration: 26, delay: -3, drift: 34, blur: 0.5, opacity: 0.62, depth: "mid" },
  { left: "65%", size: 30, duration: 18, delay: -9, drift: 42, blur: 0.2, opacity: 0.72, depth: "front" },
  { left: "73%", size: 21, duration: 25, delay: -14, drift: 68, blur: 1.1, opacity: 0.48, depth: "back" },
  { left: "80%", size: 31, duration: 20, delay: -6, drift: 56, blur: 0, opacity: 0.74, depth: "front" },
  { left: "88%", size: 25, duration: 22, delay: -11, drift: 44, blur: 0.4, opacity: 0.64, depth: "mid" },
  { left: "93%", size: 18, duration: 24, delay: -8, drift: 28, blur: 0.9, opacity: 0.44, depth: "back" },
];

export default function SakuraPetalsBackground() {
  return (
    <div className="sakuraLayer" aria-hidden="true">
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className={`sakuraPetal sakuraPetal-${petal.depth}`}
          style={
            {
              "--petal-left": petal.left,
              "--petal-size": `${petal.size}px`,
              "--petal-duration": `${petal.duration}s`,
              "--petal-delay": `${petal.delay}s`,
              "--petal-drift": `${petal.drift}px`,
              "--petal-blur": `${petal.blur}px`,
              "--petal-opacity": petal.opacity,
            } as CSSProperties
          }
        >
          <svg className="sakuraPetalSvg" viewBox="0 0 100 120" aria-hidden="true">
            <defs>
              <linearGradient id={`sakura-petal-gradient-${index}`} x1="18" y1="10" x2="80" y2="102" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(255, 240, 246, 1)" />
                <stop offset="58%" stopColor="rgba(246, 186, 223, 0.96)" />
                <stop offset="100%" stopColor="rgba(203, 150, 243, 0.84)" />
              </linearGradient>
            </defs>
            <path
              d="M50 8C66 9 84 24 86 44C87 62 75 78 64 90C58 96 54 103 50 112C46 103 42 96 36 90C25 78 13 62 14 44C16 24 34 9 50 8Z"
              className="sakuraPetalFill"
              fill={`url(#sakura-petal-gradient-${index})`}
            />
            <path
              d="M50 18C57 32 60 49 57 68"
              className="sakuraPetalVein"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
