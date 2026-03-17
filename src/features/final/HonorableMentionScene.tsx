import { useMemo, useState } from "react";
import { resolveMediaSrc } from "../quest/media";
import { useDelayedReveal } from "./useDelayedReveal";
import { useSpeechVoiceover } from "./useSpeechVoiceover";
import { useTypewriterText } from "./useTypewriterText";

const HONORABLE_MENTION_TEXT =
  "И вот он, почётный honorable mention этого квеста: герой, который смотрит в камеру снизу вверх так уверенно, словно сейчас официально предъявит всей вселенной за недостаточно серьёзное отношение к величию абсурда. Комичный фильтр раздул лицо до почти мифологического масштаба, и от этого взгляд становится ещё сильнее: он одновременно грозный, смешной и абсолютно незабываемый. А по краям кадра, как верные спутники этого эпического безумия, выстроились бургеры — не просто еда, а полноценные свидетели момента, будто это не фото, а постер к блокбастеру, где судьба мира зависит от харизмы, мемности и идеального перекуса. В этом кадре всё работает вместе: искажение, абсурд, спокойная самоуверенность и тот редкий вайб, который невозможно пересказать без улыбки. Это не просто финальная картинка. Это торжественное появление персонажа, которого уже невозможно забыть.";

type HonorableMentionSceneProps = {
  audioVolume: number;
  onSkip: () => void;
};

export default function HonorableMentionScene({ audioVolume, onSkip }: HonorableMentionSceneProps) {
  const [photoSrc, setPhotoSrc] = useState(() => resolveMediaSrc("/media/honorable-mention-photo.jpg"));
  const typedText = useTypewriterText(HONORABLE_MENTION_TEXT);
  const showSkip = useDelayedReveal(5000);
  const imageFallbackSrc = useMemo(() => resolveMediaSrc("/media/honorable-mention-photo.png"), []);

  useSpeechVoiceover(HONORABLE_MENTION_TEXT, audioVolume);

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
          <div className="sectionBadge">Особое упоминание</div>
          <h1 className="honorableTitle">Honorable Mention</h1>
          <p className="honorableText">
            {typedText.text}
            <span className={`honorableCursor ${typedText.isComplete ? "is-hidden" : ""}`} aria-hidden="true">
              |
            </span>
          </p>
        </div>
      </div>

      <div className={`honorableSkipOverlay ${showSkip ? "is-visible" : ""}`}>
        <button className="honorableSkipButton" type="button" onClick={onSkip}>
          Пропустить
        </button>
      </div>
    </section>
  );
}
