import type { CSSProperties } from "react";

const PETALS = [
  { left: "6%", size: 22, duration: 18, delay: -4, drift: 42, blur: 1.5, opacity: 0.52 },
  { left: "14%", size: 15, duration: 22, delay: -10, drift: 58, blur: 0, opacity: 0.6 },
  { left: "22%", size: 19, duration: 20, delay: -7, drift: 34, blur: 0.8, opacity: 0.56 },
  { left: "31%", size: 13, duration: 24, delay: -15, drift: 48, blur: 1.2, opacity: 0.44 },
  { left: "35%", size: 17, duration: 21, delay: -17, drift: 36, blur: 0.3, opacity: 0.58 },
  { left: "39%", size: 24, duration: 21, delay: -2, drift: 62, blur: 0.4, opacity: 0.6 },
  { left: "48%", size: 17, duration: 19, delay: -12, drift: 44, blur: 0.2, opacity: 0.66 },
  { left: "57%", size: 14, duration: 23, delay: -5, drift: 54, blur: 1.8, opacity: 0.4 },
  { left: "61%", size: 20, duration: 26, delay: -3, drift: 28, blur: 0.9, opacity: 0.5 },
  { left: "66%", size: 21, duration: 18, delay: -9, drift: 38, blur: 0.6, opacity: 0.56 },
  { left: "74%", size: 16, duration: 25, delay: -14, drift: 66, blur: 1.4, opacity: 0.42 },
  { left: "83%", size: 23, duration: 20, delay: -6, drift: 52, blur: 0, opacity: 0.62 },
  { left: "91%", size: 18, duration: 22, delay: -11, drift: 40, blur: 0.7, opacity: 0.5 },
];

export default function SakuraPetalsBackground() {
  return (
    <div className="sakuraLayer" aria-hidden="true">
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className="sakuraPetal"
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
        />
      ))}
    </div>
  );
}
