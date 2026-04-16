import { useState } from "react";
import { View, Text, StyleSheet, Platform, Image, Pressable } from "react-native";
import AppVideo from "./AppVideo";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function PlaceCard({ name, category, distance, rating, imageUrl, videoUrl, onPress }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const distanceLabel =
    distance === null || distance === undefined || distance === ""
      ? "Distance unknown"
      : `${distance} km away`;
  const ratingLabel = rating === null || rating === undefined ? "—" : rating;
  const isVideoLike = (url) => /\.(mp4|mov|m4v|webm|avi|mkv)(\?|$)/i.test(String(url || ""));
  const effectiveVideoUrl = videoUrl || (isVideoLike(imageUrl) ? imageUrl : null);
  const showImage = !!imageUrl && !isVideoLike(imageUrl) && !imageFailed;
  const showVideo = !showImage && !!effectiveVideoUrl && !videoFailed;

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.card}>
      <View style={styles.imageWrap}>
        {showImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onError={(e) => {
              console.warn("PlaceCard image failed:", imageUrl, e?.nativeEvent || e);
              setImageFailed(true);
            }}
          />
        ) : showVideo && Platform.OS === "web" ? (
          <video
            src={effectiveVideoUrl}
            muted
            autoPlay
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : showVideo ? (
          <AppVideo
            source={{ uri: effectiveVideoUrl }}
            style={styles.video}
            contentFit="cover"
            loop
            autoPlay
            muted
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>
              {imageUrl ? "Image unavailable" : effectiveVideoUrl ? "Video unavailable" : "No image"}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>{category}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <View style={styles.footer}>
          <Text style={styles.meta}>{distanceLabel}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ {ratingLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    padding: spacing.lg,
    minHeight: 122,
    justifyContent: "space-between",
  },
  imageWrap: {
    width: "100%",
    height: 140,
    backgroundColor: colors.accent,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  imageFallbackText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "800",
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },
  name: {
    ...typography.h3,
    color: colors.text,
    minHeight: 48,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  meta: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
});
