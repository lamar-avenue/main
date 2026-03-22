import { useEffect, useMemo, useRef } from "react";
import { resolveMediaSrc } from "../quest/media";

export type UiSoundCue =
  | "hover"
  | "success"
  | "error"
  | "step-open"
  | "credits-open"
  | "skip";

type ToneStep = {
  durationMs: number;
  frequency: number;
  gain: number;
  type?: OscillatorType;
};

type CueDefinition = {
  src: string | null;
  volume: number;
  playbackRate?: number;
  cooldownMs?: number;
  fallback: ToneStep[];
};

export const UI_SOUND_LIBRARY: Record<UiSoundCue, CueDefinition> = {
  hover: {
    src: null,
    volume: 0.12,
    cooldownMs: 90,
    fallback: [
      { durationMs: 36, frequency: 1240, gain: 0.018, type: "sine" },
      { durationMs: 48, frequency: 1480, gain: 0.013, type: "triangle" },
    ],
  },
  success: {
    src: null,
    volume: 0.16,
    cooldownMs: 140,
    fallback: [
      { durationMs: 90, frequency: 740, gain: 0.022, type: "triangle" },
      { durationMs: 120, frequency: 988, gain: 0.016, type: "sine" },
    ],
  },
  error: {
    src: null,
    volume: 0.14,
    cooldownMs: 140,
    fallback: [
      { durationMs: 92, frequency: 360, gain: 0.018, type: "triangle" },
      { durationMs: 108, frequency: 290, gain: 0.015, type: "sine" },
    ],
  },
  "step-open": {
    src: null,
    volume: 0.14,
    cooldownMs: 220,
    fallback: [
      { durationMs: 120, frequency: 420, gain: 0.014, type: "sine" },
      { durationMs: 180, frequency: 620, gain: 0.012, type: "triangle" },
    ],
  },
  "credits-open": {
    src: null,
    volume: 0.16,
    cooldownMs: 400,
    fallback: [
      { durationMs: 220, frequency: 392, gain: 0.014, type: "sine" },
      { durationMs: 280, frequency: 523.25, gain: 0.012, type: "triangle" },
    ],
  },
  skip: {
    src: null,
    volume: 0.14,
    cooldownMs: 160,
    fallback: [
      { durationMs: 52, frequency: 680, gain: 0.016, type: "triangle" },
      { durationMs: 74, frequency: 540, gain: 0.012, type: "sine" },
    ],
  },
};

class UiSoundEngine {
  private audioContext: AudioContext | null = null;
  private lastPlayedAt = new Map<UiSoundCue, number>();

  private getContext() {
    if (typeof window === "undefined") return null;

    if (!this.audioContext) {
      const ContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!ContextCtor) return null;
      this.audioContext = new ContextCtor();
    }

    return this.audioContext;
  }

  async play(cueName: UiSoundCue) {
    const cue = UI_SOUND_LIBRARY[cueName];
    const now = performance.now();
    const previousPlayAt = this.lastPlayedAt.get(cueName) ?? 0;

    if (cue.cooldownMs && now - previousPlayAt < cue.cooldownMs) {
      return;
    }

    this.lastPlayedAt.set(cueName, now);

    if (cue.src) {
      const audio = new Audio(resolveMediaSrc(cue.src));
      audio.volume = cue.volume;
      audio.playbackRate = cue.playbackRate ?? 1;
      audio.preload = "auto";

      try {
        await audio.play();
        return;
      } catch {
        return this.playFallback(cue);
      }
    }

    await this.playFallback(cue);
  }

  private async playFallback(cue: CueDefinition) {
    const context = this.getContext();
    if (!context) return;

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return;
      }
    }

    const now = context.currentTime;

    cue.fallback.forEach((tone, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const startAt = now + index * 0.028;
      const endAt = startAt + tone.durationMs / 1000;

      oscillator.type = tone.type ?? "sine";
      oscillator.frequency.setValueAtTime(tone.frequency, startAt);

      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(tone.gain, startAt + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
    });
  }

  dispose() {
    if (!this.audioContext) return;
    void this.audioContext.close();
    this.audioContext = null;
  }
}

type UseUiSoundDesignResult = {
  playUiSound: (cue: UiSoundCue) => void;
};

const HOVER_SELECTOR = "button, a[href], input[type='range']";

export function useUiSoundDesign(): UseUiSoundDesignResult {
  const engine = useMemo(() => new UiSoundEngine(), []);
  const lastHoverElementRef = useRef<Element | null>(null);

  useEffect(() => {
    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest(HOVER_SELECTOR) : null;
      if (!target || target === lastHoverElementRef.current) return;
      if (target instanceof HTMLElement && target.dataset.sfx === "off") return;

      lastHoverElementRef.current = target;
      void engine.play("hover");
    };

    const handlePointerLeave = () => {
      lastHoverElementRef.current = null;
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("pointerdown", handlePointerLeave, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerdown", handlePointerLeave);
      document.removeEventListener("pointerleave", handlePointerLeave);
      engine.dispose();
    };
  }, [engine]);

  return {
    playUiSound: (cue) => {
      void engine.play(cue);
    },
  };
}
