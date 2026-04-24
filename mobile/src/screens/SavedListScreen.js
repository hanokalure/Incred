import { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Image, Pressable,
  ActivityIndicator, FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { attachDistanceToPlaces, requestCurrentLocation } from "../services/locationHelpers";
import { fetchSavedPlaceCards } from "../services/savedApi";
import { toDisplayImageUrl } from "../services/mediaUrl";

function formatLabel(str) {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ─── Icon color palette (same as profile screen) ──────────────────────────────
const CATEGORY_COLOR = {
  restaurant: { bg: "#FEF5E7", icon: "#D35400" },
  stay:       { bg: "#EBF5FB", icon: "#2980B9" },
  temple:     { bg: "#F5EEF8", icon: "#8E44AD" },
  waterfall:  { bg: "#E8F8F5", icon: "#16A085" },
  park:       { bg: "#EAFAF1", icon: "#27AE60" },
  fort:       { bg: "#FDECEA", icon: "#C0392B" },
  beach:      { bg: "#EBF5FB", icon: "#1A5276" },
  default:    { bg: "#F2F3F4", icon: "#566573" },
};

function categoryPalette(category) {
  const key = String(category || "").toLowerCase();
  return CATEGORY_COLOR[key] || CATEGORY_COLOR.default;
}

// ─── Compact horizontal place row ────────────────────────────────────────────
function PlaceRow({ name, category, distance, rating, imageUrl, onPress }) {
  const [imgFailed, setImgFailed] = useState(false);
  const palette = categoryPalette(category);
  const distLabel = distance != null ? `${distance} km` : null;
  const ratingLabel = rating != null ? String(rating) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {imageUrl && !imgFailed ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbImg}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={[styles.thumbFallback, { backgroundColor: palette.bg }]}>
            <Ionicons name="image-outline" size={22} color={palette.icon} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
        <View style={styles.rowMeta}>
          {/* Category pill */}
          <View style={[styles.catPill, { backgroundColor: palette.bg }]}>
            <Text style={[styles.catText, { color: palette.icon }]}>
              {formatLabel(category) || "Place"}
            </Text>
          </View>
          {/* Distance */}
          {distLabel && (
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={styles.metaText}>{distLabel}</Text>
            </View>
          )}
          {/* Rating */}
          {ratingLabel && (
            <View style={styles.metaChip}>
              <Ionicons name="star" size={11} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.text, fontWeight: "700" }]}>
                {ratingLabel}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SavedListScreen({ navigation }) {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const load = useCallback(async () => {
    try {
      const places = await fetchSavedPlaceCards();
      setSavedPlaces(places || []);
    } catch {
      setSavedPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    requestCurrentLocation().then(setUserLocation).catch(() => {});
  }, []);

  const visiblePlaces = attachDistanceToPlaces(savedPlaces, userLocation);

  return (
    <PageCard>
      <ScreenHeader title="Saved Places" onBack={() => navigation.goBack()} />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 60 }}
        />
      ) : savedPlaces.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bookmark-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptySubtitle}>
            Explore places and tap the bookmark to save them here.
          </Text>
        </View>
      ) : (
        <>
          {/* Count header */}
          <Text style={styles.countLabel}>
            {savedPlaces.length} place{savedPlaces.length !== 1 ? "s" : ""} saved
          </Text>

          {/* Group card */}
          <View style={styles.listCard}>
            <FlatList
              data={visiblePlaces}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <>
                  <PlaceRow
                    name={item.name}
                    category={item.category}
                    distance={item.distance}
                    rating={item.avg_rating ?? item.rating}
                    imageUrl={toDisplayImageUrl(item.image_urls?.[0])}
                    onPress={() => navigation.navigate("PlaceDetail", { id: item.id })}
                  />
                  {index < visiblePlaces.length - 1 && (
                    <View style={styles.rowDivider} />
                  )}
                </>
              )}
            />
          </View>
        </>
      )}
    </PageCard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const THUMB_SIZE = 62;

const styles = StyleSheet.create({
  // Count
  countLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    paddingLeft: 2,
  },

  // Group card (same as profile groups)
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.accent,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: THUMB_SIZE + spacing.md * 2, // starts after thumbnail
  },

  // Thumbnail
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // Info
  rowInfo: {
    flex: 1,
    gap: 5,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    letterSpacing: -0.1,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },
  catPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },

  // Empty state
  empty: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    fontSize: 17,
    color: colors.text,
    fontWeight: "700",
  },
  emptySubtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
