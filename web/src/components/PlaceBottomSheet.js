import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "./PrimaryButton";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { getPlaceCategoryLabel } from "../constants/placeCategories";

function buildPreviewMedia(place, limit = 3) {
  const images = (place?.image_urls || []).map((url) => ({ type: "image", url }));
  const videos = (place?.video_urls || []).map((url) => ({ type: "video", url }));
  return [...images, ...videos].slice(0, limit);
}

export default function PlaceBottomSheet({
  place,
  onClose,
  onOpenDetails,
  onDirections,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const heroUrl = useMemo(() => {
    const media = buildPreviewMedia(place, 1)[0];
    if (!media) return null;
    return {
      type: media.type,
      url: media.type === "image" ? toDisplayImageUrl(media.url) : toDisplayMediaUrl(media.url),
    };
  }, [place]);
  const gallery = useMemo(() => buildPreviewMedia(place, 3), [place]);
  const photoCount = place?.image_urls?.length || 0;
  const videoCount = place?.video_urls?.length || 0;

  useEffect(() => {
    setImageFailed(false);
  }, [place?.id]);

  if (!place) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getPlaceCategoryLabel(place.category)}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {place.name}
        </Text>

        {place.address ? (
          <Text style={styles.address} numberOfLines={2}>
            {place.address}
          </Text>
        ) : null}

        <Text style={styles.mediaMeta}>
          {photoCount} photo{photoCount === 1 ? "" : "s"} • {videoCount} video{videoCount === 1 ? "" : "s"}
        </Text>

        {heroUrl && !(heroUrl.type === "image" && imageFailed) ? (
          <View style={styles.heroWrap}>
            {heroUrl.type === "image" ? (
              <Image
                source={{ uri: heroUrl.url }}
                style={styles.hero}
                resizeMode="contain"
                onError={() => setImageFailed(true)}
              />
            ) : Platform.OS === "web" ? (
              <video
                src={heroUrl.url}
                muted
                autoPlay
                loop
                playsInline
                controls
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
              />
            ) : (
              <Text style={styles.heroFallback}>Video available</Text>
            )}
          </View>
        ) : (
          <View style={styles.heroWrap}>
            <Text style={styles.heroFallback}>No photo</Text>
          </View>
        )}

        {gallery.length > 1 ? (
          <View style={styles.strip}>
            {gallery.slice(1).map((item, index) => (
              <View key={`${item.url}-${index}`} style={styles.thumb}>
                {item.type === "image" ? (
                  <Image source={{ uri: toDisplayImageUrl(item.url) }} style={styles.thumbMedia} resizeMode="cover" />
                ) : Platform.OS === "web" ? (
                  <video
                    src={toDisplayMediaUrl(item.url)}
                    muted
                    autoPlay
                    loop
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Text style={styles.thumbFallback}>Video</Text>
                )}
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton label="Open Details" onPress={onOpenDetails} />
          <View style={styles.spacer} />
          <PrimaryButton label="Directions" onPress={onDirections} variant="ghost" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
  },
  sheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    boxShadow: "0px 18px 40px rgba(0,0,0,0.25)",
  },
  handleWrap: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  handle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.elevated,
  },
  closeText: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: -2,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  address: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  mediaMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  heroWrap: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  hero: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  strip: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  thumb: {
    flex: 1,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbMedia: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  actions: {
    marginTop: spacing.sm,
  },
  spacer: {
    height: spacing.md,
  },
});
