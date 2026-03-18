import { useEffect, useId, useMemo, useState } from "react";
import { resolveMediaSrc } from "../quest/media";
import { useDelayedReveal } from "./useDelayedReveal";
import { useSpeechVoiceover } from "./useSpeechVoiceover";

type HonorableMentionSceneProps = {
  isExiting: boolean;
  onSkip: () => void;
};

const HONORABLE_COPY =
  "Это тестовая русская озвучка для honorable mention. Здесь может быть любой временный текст-заглушка. Главное, что сцена звучит отдельно, без фоновой музыки сайта, и остаётся самостоятельным финальным кадром.";

export default function HonorableMentionScene({ isExiting, onSkip }: HonorableMentionSceneProps) {
  const sourceId = useId();
  const [photoSrc, setPhotoSrc] = useState(() => resolveMediaSrc("/media/honorable-mention-photo.jpg"));
  const [voiceVolume, setVoiceVolume] = useState(0.88);
  const [previousVoiceVolume, setPreviousVoiceVolume] = useState(0.88);
  const showSkip = useDelayedReveal(5000);
  const imageFallbackSrc = useMemo(() => resolveMediaSrc("/media/honorable-mention-photo.png"), []);
  const isSpeechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useSpeechVoiceover(HONORABLE_COPY, isSpeechSupported ? voiceVolume : 0, sourceId);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  function handleVolumeChange(nextVolume: number) {
    setVoiceVolume(nextVolume);
    if (nextVolume > 0) {
      setPreviousVoiceVolume(nextVolume);
    }
  }

  function toggleMute() {
    if (voiceVolume === 0) {
      setVoiceVolume(previousVoiceVolume > 0 ? previousVoiceVolume : 0.88);
      return;
    }

    setPreviousVoiceVolume(voiceVolume);
    setVoiceVolume(0);
  }

  return (
    <section className={`honorableScene screenEnter ${isExiting ? "is-exiting" : ""}`}>
      <div className="honorableGlow" aria-hidden="true" />

      <div className="honorablePhotoStage">
        <div className="honorableImageAura" />
        <img
          className="honorableImage honorableImage-full"
          src={photoSrc}
          alt="Honorable mention"
          onError={() => {
            if (photoSrc !== imageFallbackSrc) {
              setPhotoSrc(imageFallbackSrc);
            }
          }}
        />

        <div className="honorableControlDock">
          <div className="honorableAudioControl glowInset">
            <button
              className={`honorableMuteButton ${voiceVolume === 0 ? "is-muted" : ""}`}
              type="button"
              onClick={toggleMute}
              aria-label={voiceVolume === 0 ? "Включить озвучку honorable mention" : "Выключить озвучку honorable mention"}
            >
              <AudioVolumeIcon muted={voiceVolume === 0} />
            </button>
            <input
              className="slider volumeSlider honorableVolumeSlider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={voiceVolume}
              onChange={(event) => handleVolumeChange(Number(event.target.value))}
              aria-label="Громкость honorable mention"
            />
          </div>
        </div>
      </div>

      <div className={`honorableSkipOverlay ${showSkip ? "is-visible" : ""}`} aria-hidden={!showSkip}>
        <button className="honorableSkipButton" type="button" onClick={onSkip} disabled={!showSkip}>
          Пропустить
        </button>
      </div>
    </section>
  );
}

function AudioVolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10.5H8.4L12.6 6.8C13.12 6.34 13.94 6.71 13.94 7.4V16.6C13.94 17.29 13.12 17.66 12.6 17.2L8.4 13.5H5C4.45 13.5 4 13.05 4 12.5V11.5C4 10.95 4.45 10.5 5 10.5Z" />
      {muted ? (
        <path d="M17.2 8.8L21 16.2" />
      ) : (
        <>
          <path d="M17.2 9.2C18.12 10.03 18.67 11.22 18.67 12.5C18.67 13.78 18.12 14.97 17.2 15.8" />
          <path d="M18.9 6.8C20.43 8.17 21.33 10.27 21.33 12.5C21.33 14.73 20.43 16.83 18.9 18.2" />
        </>
      )}
    </svg>
  );
}
