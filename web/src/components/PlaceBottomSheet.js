import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "./PrimaryButton";
import { toDisplayImageUrl } from "../services/mediaUrl";
import { getPlaceCategoryLabel } from "../constants/placeCategories";

export default function PlaceBottomSheet({
  place,
  onClose,
  onOpenDetails,
  onDirections,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const heroUrl = useMemo(() => {
    const raw = place?.image_urls?.[0];
    return raw ? toDisplayImageUrl(raw) : null;
  }, [place]);

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

        {heroUrl && !imageFailed ? (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: heroUrl }}
              style={styles.hero}
              resizeMode="contain"
              onError={() => setImageFailed(true)}
            />
          </View>
        ) : (
          <View style={styles.heroWrap}>
            <Text style={styles.heroFallback}>No photo</Text>
          </View>
        )}

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
  actions: {
    marginTop: spacing.sm,
  },
  spacer: {
    height: spacing.md,
  },
});
