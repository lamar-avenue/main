import type { CSSProperties } from "react";

const PETAL_SHAPES = [
  "M50 8C66 9 84 24 86 44C87 62 75 78 64 90C58 96 54 103 50 112C46 103 42 96 36 90C25 78 13 62 14 44C16 24 34 9 50 8Z",
  "M50 10C65 11 82 26 84 45C85 62 73 79 61 89C56 95 53 101 50 112C47 101 44 95 39 89C27 79 15 62 16 45C18 26 35 11 50 10Z",
  "M50 7C68 10 85 28 86 47C86 61 76 77 63 92C58 98 54 104 50 113C46 103 42 98 37 92C24 77 14 61 14 47C15 28 32 10 50 7Z",
];

const PETALS = [
  { left: "4%", size: 30, duration: 24, delay: -4, drift: 52, blur: 0.6, opacity: 0.74, depth: "front", tone: 0, sway: 6 },
  { left: "9%", size: 17, duration: 28, delay: -15, drift: 34, blur: 1.2, opacity: 0.38, depth: "back", tone: 1, sway: -3 },
  { left: "12%", size: 22, duration: 29, delay: -10, drift: 64, blur: 0, opacity: 0.68, depth: "mid", tone: 1, sway: -5 },
  { left: "18%", size: 26, duration: 25, delay: -7, drift: 38, blur: 0.3, opacity: 0.64, depth: "mid", tone: 2, sway: 7 },
  { left: "25%", size: 18, duration: 31, delay: -13, drift: 46, blur: 1.2, opacity: 0.46, depth: "back", tone: 1, sway: -4 },
  { left: "31%", size: 38, duration: 33, delay: -17, drift: 58, blur: 0.1, opacity: 0.56, depth: "near", tone: 0, sway: 9 },
  { left: "36%", size: 32, duration: 27, delay: -2, drift: 60, blur: 0.2, opacity: 0.72, depth: "front", tone: 0, sway: 8 },
  { left: "43%", size: 20, duration: 26, delay: -19, drift: 29, blur: 0.7, opacity: 0.5, depth: "back", tone: 2, sway: 4 },
  { left: "46%", size: 24, duration: 23, delay: -12, drift: 48, blur: 0.1, opacity: 0.76, depth: "mid", tone: 2, sway: -6 },
  { left: "52%", size: 20, duration: 30, delay: -5, drift: 54, blur: 1.4, opacity: 0.5, depth: "back", tone: 1, sway: 5 },
  { left: "57%", size: 29, duration: 32, delay: -8, drift: 36, blur: 0.3, opacity: 0.58, depth: "mid", tone: 0, sway: -6 },
  { left: "63%", size: 30, duration: 24, delay: -9, drift: 42, blur: 0.2, opacity: 0.72, depth: "front", tone: 2, sway: 6 },
  { left: "69%", size: 19, duration: 29, delay: -21, drift: 50, blur: 1, opacity: 0.42, depth: "back", tone: 1, sway: -5 },
  { left: "72%", size: 35, duration: 34, delay: -1, drift: 62, blur: 0.15, opacity: 0.54, depth: "near", tone: 2, sway: -8 },
  { left: "78%", size: 24, duration: 28, delay: -14, drift: 68, blur: 1.1, opacity: 0.48, depth: "back", tone: 1, sway: -5 },
  { left: "82%", size: 31, duration: 25, delay: -6, drift: 56, blur: 0, opacity: 0.74, depth: "front", tone: 0, sway: 7 },
  { left: "88%", size: 25, duration: 27, delay: -11, drift: 44, blur: 0.4, opacity: 0.64, depth: "mid", tone: 2, sway: -6 },
  { left: "93%", size: 18, duration: 30, delay: -8, drift: 28, blur: 0.9, opacity: 0.44, depth: "back", tone: 1, sway: 4 },
  { left: "96%", size: 22, duration: 26, delay: -18, drift: 24, blur: 0.2, opacity: 0.52, depth: "mid", tone: 0, sway: 5 },
];

type SakuraPetalsBackgroundProps = {
  variant?: "ambient" | "hero";
};

export default function SakuraPetalsBackground({ variant = "ambient" }: SakuraPetalsBackgroundProps) {
  return (
    <div className={`sakuraLayer sakuraLayer-${variant}`} aria-hidden="true">
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
              "--petal-sway": `${petal.sway}deg`,
            } as CSSProperties
          }
        >
          <svg className="sakuraPetalSvg" viewBox="0 0 100 120" aria-hidden="true">
            <defs>
              <linearGradient id={`sakura-petal-gradient-${index}`} x1="18" y1="10" x2="80" y2="102" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={petal.tone === 0 ? "rgba(255, 245, 248, 1)" : petal.tone === 1 ? "rgba(255, 238, 245, 1)" : "rgba(255, 242, 250, 1)"} />
                <stop offset="58%" stopColor={petal.tone === 0 ? "rgba(246, 186, 223, 0.96)" : petal.tone === 1 ? "rgba(241, 178, 212, 0.95)" : "rgba(233, 180, 229, 0.95)"} />
                <stop offset="100%" stopColor={petal.tone === 2 ? "rgba(194, 146, 242, 0.86)" : "rgba(203, 150, 243, 0.84)"} />
              </linearGradient>
            </defs>
            <path
              d={PETAL_SHAPES[index % PETAL_SHAPES.length]}
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
