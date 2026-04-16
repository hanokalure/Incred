import { Video, ResizeMode } from "expo-av";

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

  return (
    <Video
      source={normalizedSource}
      style={style}
      resizeMode={ResizeMode[contentFit?.toUpperCase()] || ResizeMode.COVER}
      useNativeControls={nativeControls}
      shouldPlay={autoPlay}
      isLooping={loop}
      isMuted={muted}
    />
  );
}
