type HeroScreenProps = {
  heroImage: string;
  isPlaying: boolean;
  volume: number;
  onVolumeChange: (value: number) => void;
  onToggleAudio: () => void;
  onStart: () => void;
};

export default function HeroScreen({
  heroImage,
  isPlaying,
  volume,
  onVolumeChange,
  onToggleAudio,
  onStart,
}: HeroScreenProps) {
  return (
    <section className="heroScreen screenEnter">
      <header className="heroHeader">
        <div className="heroBrand">
          <div className="heroBrandTitle">MARK QUEST</div>
          <div className="heroBrandSubtitle">BIRTHDAY SPECIAL EDITION</div>
        </div>

        <div className="heroAudioControl glowPanel">
          <button className="audioToggle" type="button" onClick={onToggleAudio} aria-label={isPlaying ? "Pause audio" : "Play audio"}>
            <AudioPlayIcon playing={isPlaying} />
          </button>
          <span className="audioIcon" aria-hidden="true">
            <AudioVolumeIcon />
          </span>
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
        <div className="heroFrameWrap">
          <div className="heroFrameGlow" />
          <img className="heroFrameImage" src={heroImage} alt="Марк" />
        </div>

        <div className="heroTextBlock">
          <h1 className="heroMainTitle">С Днем Рождения, Марк!</h1>
          <p className="heroDescription">
            Это небольшой кинематографичный квест, собранный специально для тебя.
            <br />
            Включай атмосферу, двигайся по шагам и открывай подарок в финале.
          </p>
        </div>

        <button className="heroLaunchButton" type="button" onClick={onStart}>
          Начать Квест
        </button>
      </div>

      <div className="heroFooterMeta">
        <span>signal live</span>
        <span>private sequence</span>
        <span>crafted for mark</span>
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

function AudioVolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10.5H8.4L12.6 6.8C13.12 6.34 13.94 6.71 13.94 7.4V16.6C13.94 17.29 13.12 17.66 12.6 17.2L8.4 13.5H5C4.45 13.5 4 13.05 4 12.5V11.5C4 10.95 4.45 10.5 5 10.5Z" />
      <path d="M17.2 9.2C18.12 10.03 18.67 11.22 18.67 12.5C18.67 13.78 18.12 14.97 17.2 15.8" />
      <path d="M18.9 6.8C20.43 8.17 21.33 10.27 21.33 12.5C21.33 14.73 20.43 16.83 18.9 18.2" />
    </svg>
  );
}
