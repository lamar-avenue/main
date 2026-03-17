import { useEffect, useRef } from "react";

function splitIntoChunks(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

export function useSpeechVoiceover(text: string, volume: number) {
  const volumeRef = useRef(volume);
  const chunkIndexRef = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const speakNextRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    volumeRef.current = volume;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synthesis = window.speechSynthesis;

    if (volume <= 0) {
      synthesis.cancel();
      return;
    }

    if (!synthesis.speaking && chunkIndexRef.current < chunksRef.current.length) {
      const timeoutId = window.setTimeout(() => {
        speakNextRef.current?.();
      }, 36);

      return () => window.clearTimeout(timeoutId);
    }
  }, [volume]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synthesis = window.speechSynthesis;
    const chunks = splitIntoChunks(text);
    let resumeTimeoutId: number | undefined;
    let startTimeoutId: number | undefined;
    let cancelled = false;

    chunksRef.current = chunks;
    chunkIndexRef.current = 0;

    const createUtterance = (chunk: string) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = "ru-RU";
      utterance.rate = 0.94;
      utterance.pitch = 1.02;
      utterance.volume = Math.max(0, Math.min(1, volumeRef.current));

      const voices = synthesis.getVoices();
      const russianVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("ru"));
      if (russianVoice) {
        utterance.voice = russianVoice;
      }

      utterance.onend = () => {
        if (cancelled || volumeRef.current <= 0) return;

        chunkIndexRef.current += 1;
        if (chunkIndexRef.current >= chunksRef.current.length) return;

        resumeTimeoutId = window.setTimeout(() => {
          speakNextRef.current?.();
        }, 72);
      };

      utterance.onerror = () => {
        if (cancelled) return;
        chunkIndexRef.current += 1;
        if (chunkIndexRef.current >= chunksRef.current.length) return;

        resumeTimeoutId = window.setTimeout(() => {
          speakNextRef.current?.();
        }, 72);
      };

      return utterance;
    };

    speakNextRef.current = () => {
      if (cancelled || volumeRef.current <= 0 || synthesis.speaking) return;

      const chunk = chunksRef.current[chunkIndexRef.current];
      if (!chunk) return;

      try {
        synthesis.speak(createUtterance(chunk));
      } catch {
        return;
      }
    };

    const boot = () => {
      if (cancelled || !text.trim() || volumeRef.current <= 0) return;
      synthesis.cancel();
      speakNextRef.current?.();
    };

    startTimeoutId = window.setTimeout(boot, 260);
    synthesis.addEventListener("voiceschanged", boot);

    return () => {
      cancelled = true;
      speakNextRef.current = null;
      if (startTimeoutId) {
        window.clearTimeout(startTimeoutId);
      }
      if (resumeTimeoutId) {
        window.clearTimeout(resumeTimeoutId);
      }
      synthesis.removeEventListener("voiceschanged", boot);
      synthesis.cancel();
    };
  }, [text]);
}
