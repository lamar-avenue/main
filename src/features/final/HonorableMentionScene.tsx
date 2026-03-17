import { useMemo, useState } from "react";
import { resolveMediaSrc } from "../quest/media";
import { useDelayedReveal } from "./useDelayedReveal";

type HonorableMentionSceneProps = {
  onSkip: () => void;
};

export default function HonorableMentionScene({ onSkip }: HonorableMentionSceneProps) {
  const [photoSrc, setPhotoSrc] = useState(() => resolveMediaSrc("/media/honorable-mention-photo.jpg"));
  const showSkip = useDelayedReveal(5000);
  const imageFallbackSrc = useMemo(() => resolveMediaSrc("/media/honorable-mention-photo.png"), []);

  return (
    <section className="honorableScene screenEnter">
      <div className="honorableGlow" aria-hidden="true" />

      <div className="honorablePhotoStage glowPanel">
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
      </div>

      <div className={`honorableSkipOverlay ${showSkip ? "is-visible" : ""}`} aria-hidden={!showSkip}>
        <button className="honorableSkipButton" type="button" onClick={onSkip}>
          Пропустить
        </button>
      </div>
    </section>
  );
}
