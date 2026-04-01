type HeroScreenProps = {
  heroImage: string;
  isPlaying: boolean;
  isMuted: boolean;
  isTransitioning: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
  onToggleAudio: () => void;
  onStart: () => void;
};

export default function HeroScreen({
  heroImage,
  isPlaying,
  isMuted,
  isTransitioning,
  volume,
  onToggleMute,
  onVolumeChange,
  onToggleAudio,
  onStart,
}: HeroScreenProps) {
  return (
    <section className={`heroScreen screenEnter ${isTransitioning ? "is-exiting" : ""}`}>
      <div className="heroSceneGlow" aria-hidden="true">
        <div className="heroSceneHalo" />
        <div className="heroSceneBeam heroSceneBeam-primary" />
        <div className="heroSceneBeam heroSceneBeam-secondary" />
        <div className="heroSceneBeam heroSceneBeam-orbit" />
        <div className="heroSceneRibbon heroSceneRibbon-left" />
        <div className="heroSceneRibbon heroSceneRibbon-right" />
        <div className="heroScenePetalMist" />
      </div>

      <header className="heroHeader">
        <div className="heroBrand">
          <div className="heroBrandTitle">MARK QUEST</div>
          <div className="heroBrandSubtitle">BIRTHDAY SPECIAL EDITION</div>
        </div>

        <div className="heroAudioControl glowPanel">
          <button className="audioToggle" type="button" onClick={onToggleAudio} aria-label={isPlaying ? "Pause audio" : "Play audio"}>
            <AudioPlayIcon playing={isPlaying} />
          </button>
          <button className={`audioMuteButton ${isMuted ? "is-muted" : ""}`} type="button" onClick={onToggleMute} aria-label={isMuted ? "Unmute audio" : "Mute audio"}>
            <AudioVolumeIcon muted={isMuted} />
          </button>
          <input
            className="slider volumeSlider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label="Background audio volume"
          />
        </div>
      </header>

      <div className="heroScreenCenter">
        <div className="heroCenterPanel glowPanel">
          <div className="heroPanelLines" aria-hidden="true">
            <span className="heroPanelLine heroPanelLine-top" />
            <span className="heroPanelLine heroPanelLine-left" />
            <span className="heroPanelLine heroPanelLine-right" />
            <span className="heroPanelLine heroPanelLine-bottom" />
          </div>

          <div className="heroFrameWrap">
            <div className="heroFrameGlow" />
            <div className="heroFrameAura" />
            <div className="heroFramePlate" />
            <img className="heroFrameImage" src={heroImage} alt="Марк" />
            <div className="heroFrameShine" />
            <div className="heroFrameShade" />
            <div className="heroFrameCaption glowInset">
              <span className="heroFrameCaptionLabel">Birthday Signal</span>
              <strong>Тихий вход в квест</strong>
            </div>
          </div>

          <div className="heroTextBlock">
            <div className="heroEyebrow">Soft drama. No rush. Gift ahead.</div>
            <h1 className="heroMainTitle">С Днем Рождения, Марк!</h1>
            <p className="heroDescription">
              Это квест без суеты, но с характером.
              <br />
              Немного свечения, немного иронии, немного сакуры, и подарок, который спокойно ждёт в финале.
            </p>
          </div>

          <div className="heroLaunchGroup">
            <button className="heroLaunchButton" type="button" onClick={onStart} disabled={isTransitioning}>
              <span className="heroLaunchLabel">Начать квест</span>
              <span className="heroLaunchArrow" aria-hidden="true">{"->"}</span>
            </button>
            <p className="heroLaunchHint">Без таймера. Просто красиво войди в историю.</p>
          </div>
        </div>
      </div>

      <div className="heroFooterMeta">
        <span>petals take their time</span>
        <span>velvet signal online</span>
        <span>gift with a poker face</span>
      </div>
    </section>
  );
}

function AudioPlayIcon({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="7" y="5" width="3.5" height="14" rx="1.2" />
        <rect x="13.5" y="5" width="3.5" height="14" rx="1.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6.5C8 5.72 8.84 5.24 9.5 5.63L18 10.63C18.64 11.01 18.64 11.99 18 12.37L9.5 17.37C8.84 17.76 8 17.28 8 16.5V6.5Z" />
    </svg>
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
