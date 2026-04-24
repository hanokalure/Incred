import { useEffect } from "react";
import { VideoView, useVideoPlayer } from "expo-video";

export default function AppVideo({
  source,
  style,
  contentFit = "cover",
  nativeControls = false,
  loop = false,
  muted = false,
  autoPlay = false,
}) {
  const normalizedSource =
    typeof source === "string" ? { uri: source } : source?.uri ? { uri: source.uri } : source;
  const resolvedSource = normalizedSource?.uri || normalizedSource;
  const player = useVideoPlayer(resolvedSource, (instance) => {
    instance.loop = loop;
    instance.muted = muted;
    if (autoPlay) {
      instance.play();
    }
  });

  useEffect(() => {
    if (!player) return;
    player.loop = loop;
    player.muted = muted;

    if (autoPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [autoPlay, loop, muted, player]);

  return (
    <VideoView
      player={player}
      style={style}
      contentFit={contentFit}
      nativeControls={nativeControls}
    />
  );
}
