export type BackgroundTrack = {
  id: string;
  src: string;
  title: string;
};

export const BACKGROUND_TRACKS: BackgroundTrack[] = [
  { id: "track-01", src: "/media/audio/background/track-01.mp3", title: "Track 01" },
  { id: "track-02", src: "/media/audio/background/track-02.mp3", title: "Track 02" },
  { id: "track-03", src: "/media/audio/background/track-03.mp3", title: "Track 03" },
  { id: "track-04", src: "/media/audio/background/track-04.mp3", title: "Track 04" },
  { id: "track-05", src: "/media/audio/background/track-05.mp3", title: "Track 05" },
  { id: "track-06", src: "/media/audio/background/track-06.mp3", title: "Track 06" },
  { id: "track-07", src: "/media/audio/background/track-07.mp3", title: "Track 07" },
];

export function createShuffledTrackOrder(trackCount: number) {
  const order = Array.from({ length: trackCount }, (_, index) => index);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
  }

  return order;
}
