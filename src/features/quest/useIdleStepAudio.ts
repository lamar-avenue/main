import { useEffect, useId, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { announceSceneAudioStart, subscribeToSceneAudioStart } from "../audio/sceneAudioBus";

const IDLE_AUDIO_DELAY_MS = 10_000;

type SceneAudioStateSetter = Dispatch<SetStateAction<string | null>>;

export function useIdleStepAudio({
  enabled,
  stepId,
  onSceneAudioStateChange,
}: {
  enabled: boolean;
  stepId: string;
  onSceneAudioStateChange: SceneAudioStateSetter;
}) {
  const sourceId = useId();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const hasPlayedRef = useRef(false);

  function clearIdleTimer() {
    if (timerRef.current == null) return;

    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function scheduleIdlePlayback() {
    if (!enabled || hasPlayedRef.current) return;

    clearIdleTimer();
    timerRef.current = window.setTimeout(async () => {
      const audio = audioRef.current;
      if (!audio || hasPlayedRef.current) return;

      announceSceneAudioStart(sourceId);

      try {
        await audio.play();
        hasPlayedRef.current = true;
      } catch {
        return;
      }
    }, IDLE_AUDIO_DELAY_MS);
  }

  function registerActivity() {
    if (!enabled || hasPlayedRef.current) return;
    scheduleIdlePlayback();
  }

  useEffect(() => {
    const audio = audioRef.current;

    hasPlayedRef.current = false;
    clearIdleTimer();

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    onSceneAudioStateChange((current) => (current === sourceId ? null : current));

    if (!enabled) {
      return;
    }

    scheduleIdlePlayback();

    return () => {
      clearIdleTimer();

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      onSceneAudioStateChange((current) => (current === sourceId ? null : current));
    };
  }, [enabled, onSceneAudioStateChange, sourceId, stepId]);

  useEffect(() => {
    if (!enabled) return;

    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      announceSceneAudioStart(sourceId);
      onSceneAudioStateChange(sourceId);
    };

    const handleStop = () => {
      onSceneAudioStateChange((current) => (current === sourceId ? null : current));
    };

    const unsubscribe = subscribeToSceneAudioStart(sourceId, () => {
      audio.pause();
    });

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handleStop);
    audio.addEventListener("ended", handleStop);

    return () => {
      unsubscribe();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handleStop);
      audio.removeEventListener("ended", handleStop);
    };
  }, [enabled, onSceneAudioStateChange, sourceId]);

  return { audioRef, registerActivity };
}
