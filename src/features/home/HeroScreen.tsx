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
            {isPlaying ? "II" : ">"}
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
