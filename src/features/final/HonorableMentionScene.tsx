import { useMemo, useRef, useState } from "react";
import { resolveMediaSrc } from "../quest/media";
import { useDelayedReveal } from "./useDelayedReveal";
import { useSpeechVoiceover } from "./useSpeechVoiceover";
import { useTypewriterText } from "./useTypewriterText";

const HONORABLE_MENTION_TEXT =
  "И вот он, почётный honorable mention этого квеста: герой, который смотрит в камеру снизу вверх так уверенно, словно сейчас официально предъявит всей вселенной за недостаточно серьёзное отношение к величию абсурда. Комичный фильтр раздул лицо до почти мифологического масштаба, и от этого взгляд становится ещё сильнее: он одновременно грозный, смешной и абсолютно незабываемый. А по краям кадра, как верные спутники этого эпического безумия, выстроились бургеры — не просто еда, а полноценные свидетели момента, будто это не фото, а постер к блокбастеру, где судьба мира зависит от харизмы, мемности и идеального перекуса. В этом кадре всё работает вместе: искажение, абсурд, спокойная самоуверенность и тот редкий вайб, который невозможно пересказать без улыбки. Это не просто финальная картинка. Это торжественное появление персонажа, которого уже невозможно забыть.";

type HonorableMentionSceneProps = {
  onSkip: () => void;
};

export default function HonorableMentionScene({ onSkip }: HonorableMentionSceneProps) {
  const [photoSrc, setPhotoSrc] = useState(() => resolveMediaSrc("/media/honorable-mention-photo.jpg"));
  const [sceneVolume, setSceneVolume] = useState(0.78);
  const typedText = useTypewriterText(HONORABLE_MENTION_TEXT);
  const showSkip = useDelayedReveal(5000);
  const imageFallbackSrc = useMemo(() => resolveMediaSrc("/media/honorable-mention-photo.png"), []);
  const previousSceneVolumeRef = useRef(0.78);
  const isMuted = sceneVolume === 0;

  useSpeechVoiceover(HONORABLE_MENTION_TEXT, sceneVolume);

  function handleSceneVolumeChange(nextVolume: number) {
    setSceneVolume(nextVolume);
    if (nextVolume > 0) {
      previousSceneVolumeRef.current = nextVolume;
    }
  }

  function toggleSceneMute() {
    if (sceneVolume === 0) {
      setSceneVolume(previousSceneVolumeRef.current > 0 ? previousSceneVolumeRef.current : 0.78);
      return;
    }

    previousSceneVolumeRef.current = sceneVolume;
    setSceneVolume(0);
  }

  return (
    <section className="honorableScene screenEnter">
      <div className="honorableGlow" aria-hidden="true" />

      <div className="honorableLayout">
        <div className="honorableImagePanel glowPanel">
          <div className="honorableImageAura" />
          <img
            className="honorableImage"
            src={photoSrc}
            alt="Honorable mention"
            onError={() => {
              if (photoSrc !== imageFallbackSrc) {
                setPhotoSrc(imageFallbackSrc);
              }
            }}
          />
        </div>

        <div className="honorableCopy glowPanel">
          <div className="honorableSceneMeta">
            <div>
              <div className="sectionBadge">Особое упоминание</div>
              <h1 className="honorableTitle">Honorable Mention</h1>
            </div>

            <div className="honorableAudioControl glowInset">
              <button
                className={`honorableMuteButton ${isMuted ? "is-muted" : ""}`}
                type="button"
                onClick={toggleSceneMute}
                aria-label={isMuted ? "Включить звук сцены" : "Выключить звук сцены"}
              >
                <HonorableVolumeIcon muted={isMuted} />
              </button>
              <input
                className="slider honorableVolumeSlider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sceneVolume}
                onChange={(event) => handleSceneVolumeChange(Number(event.target.value))}
                aria-label="Громкость honorable mention"
              />
            </div>
          </div>

          <p className="honorableText">
            {typedText.text}
            <span className={`honorableCursor ${typedText.isComplete ? "is-hidden" : ""}`} aria-hidden="true">
              |
            </span>
          </p>
        </div>
      </div>

      <div className={`honorableSkipOverlay ${showSkip ? "is-visible" : ""}`} aria-hidden={!showSkip}>
        <button className="honorableSkipButton" type="button" onClick={onSkip}>
          Пропустить
        </button>
      </div>
    </section>
  );
}

function HonorableVolumeIcon({ muted }: { muted: boolean }) {
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
