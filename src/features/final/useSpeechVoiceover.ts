import { useEffect } from "react";

export function useSpeechVoiceover(text: string) {
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synthesis = window.speechSynthesis;
    let started = false;

    const speak = () => {
      if (started || !text.trim()) return;
      started = true;

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ru-RU";
        utterance.rate = 0.94;
        utterance.pitch = 1.02;
        utterance.volume = 1;

        const voices = synthesis.getVoices();
        const russianVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("ru"));
        if (russianVoice) {
          utterance.voice = russianVoice;
        }

        synthesis.cancel();
        synthesis.speak(utterance);
      } catch {
        return;
      }
    };

    const startTimeoutId = window.setTimeout(speak, 260);
    synthesis.addEventListener("voiceschanged", speak);

    return () => {
      window.clearTimeout(startTimeoutId);
      synthesis.removeEventListener("voiceschanged", speak);
      synthesis.cancel();
    };
  }, [text]);
}
