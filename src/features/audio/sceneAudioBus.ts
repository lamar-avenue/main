const SCENE_AUDIO_START_EVENT = "mark-quest:scene-audio-start";

type SceneAudioStartDetail = {
  sourceId: string;
};

export function announceSceneAudioStart(sourceId: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<SceneAudioStartDetail>(SCENE_AUDIO_START_EVENT, {
      detail: { sourceId },
    }),
  );
}

export function subscribeToSceneAudioStart(sourceId: string, onOtherSourceStart: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStart = (event: Event) => {
    const customEvent = event as CustomEvent<SceneAudioStartDetail>;
    if (customEvent.detail?.sourceId === sourceId) return;
    onOtherSourceStart();
  };

  window.addEventListener(SCENE_AUDIO_START_EVENT, handleStart);

  return () => {
    window.removeEventListener(SCENE_AUDIO_START_EVENT, handleStart);
  };
}
