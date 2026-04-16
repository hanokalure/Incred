import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Linking, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PlaceCard from "../components/PlaceCard";
import LeafletPlacesMap from "../components/LeafletPlacesMap";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaces } from "../services/placesApi";
import { attachDistanceToPlaces, requestCurrentLocation, reverseGeocodeLocation } from "../services/locationHelpers";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";

function categoryLabel(value) {
  const mapping = {
    restaurant: "Food",
    stay: "Stay",
    generational_shop: "Shops",
    hidden_gem: "Hidden Gems",
    tourist_place: "Tourist",
  };
  return mapping[value] || value || "Other";
}

function hasCoordinates(place) {
  return Number.isFinite(Number(place?.latitude)) && Number.isFinite(Number(place?.longitude));
}

export default function MapScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [locationError, setLocationError] = useState("");
  const [activePlace, setActivePlace] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchPlaces()
      .then((data) => setPlaces(data || []))
      .catch(() => setPlaces([]));
  }, []);

  const resolveLocation = async () => {
    setLocationError("");
    const nextLocation = await requestCurrentLocation();
    if (!nextLocation) {
      setLocationName("");
      setLocationError("Device location is unavailable. Showing Karnataka-wide results instead.");
      return;
    }
    setUserLocation(nextLocation);
    const resolvedName = await reverseGeocodeLocation(nextLocation);
    setLocationName(resolvedName || "");
  };

  useEffect(() => {
    resolveLocation().catch(() => {
      setLocationError("Device location is unavailable. Showing Karnataka-wide results instead.");
    });
  }, []);

  const visiblePlaces = useMemo(() => {
    const withDistance = attachDistanceToPlaces(places, userLocation);
    return [...withDistance].sort((a, b) => {
      const left = a.distance ?? Number.MAX_SAFE_INTEGER;
      const right = b.distance ?? Number.MAX_SAFE_INTEGER;
      return left - right;
    });
  }, [places, userLocation]);

  const mappablePlaces = useMemo(
    () => visiblePlaces.filter((place) => hasCoordinates(place)),
    [visiblePlaces]
  );

  useEffect(() => {
    if (!visiblePlaces.length) {
      setActivePlace(null);
      setSheetOpen(false);
      return;
    }

    setActivePlace((current) => {
      if (current && visiblePlaces.some((place) => String(place.id) === String(current.id))) {
        return visiblePlaces.find((place) => String(place.id) === String(current.id)) || current;
      }
      return visiblePlaces[0];
    });
  }, [visiblePlaces]);

  const handleDirections = async (place) => {
    if (!place || !hasCoordinates(place)) return;

    const destination = `${place.latitude},${place.longitude}`;
    const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : "";
    const base = "https://www.google.com/maps/dir/?api=1";
    const url = origin
      ? `${base}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
      : `${base}&destination=${encodeURIComponent(destination)}`;

    Linking.openURL(url).catch(() => {});
  };

  const center = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [14.8, 75.8];

  const centerLabel = userLocation
    ? locationName || `Near ${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)}`
    : "Centered on Karnataka";

  return (
    <PageCard>
      <ScreenHeader title="Interactive Map" onBack={() => navigation.goBack()} />

      <View style={styles.locationRow}>
        <Pressable onPress={() => resolveLocation()} style={styles.locationButton}>
          <Ionicons name="locate-outline" size={16} color={colors.text} />
          <Text style={styles.locationButtonText}>{userLocation ? "Refresh location" : "Center on me"}</Text>
        </Pressable>
        <Text style={styles.locationMeta}>{centerLabel}</Text>
        {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
      </View>

      <View style={styles.mapFrame}>
        <View style={styles.mapHeader}>
          <View>
            <Text style={styles.mapEyebrow}>Live map</Text>
            <Text style={styles.mapTitle}>Explore places around {locationName || "Karnataka"}</Text>
            <Text style={styles.mapSubtitle}>OpenStreetMap pins with tap-to-open place details.</Text>
          </View>
          <View style={styles.mapStats}>
            <Text style={styles.mapStatsValue}>{mappablePlaces.length}</Text>
            <Text style={styles.mapStatsLabel}>mapped</Text>
          </View>
        </View>

        <View style={styles.mapLegend}>
          <View style={styles.legendPill}>
            <Ionicons name="radio-button-on" size={12} color={colors.secondary} />
            <Text style={styles.legendText}>{visiblePlaces.length} visible places</Text>
          </View>
          <View style={styles.legendPill}>
            <Ionicons name="pin-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.legendText}>Tap any pin to open the details sheet</Text>
          </View>
        </View>

        <View style={styles.mapCanvas}>
          <LeafletPlacesMap
            places={visiblePlaces}
            selectedCategory="All"
            center={center}
            userLocation={userLocation}
            activePlaceId={activePlace?.id}
            onSelectPlace={(place) => {
              setActivePlace(place);
              setSheetOpen(true);
            }}
          />
        </View>
      </View>

      <Modal
        visible={sheetOpen && !!activePlace}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)} />
          {activePlace ? (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleWrap}>
                  <Text style={styles.sheetEyebrow}>Selected place</Text>
                  <Text style={styles.sheetTitle}>{activePlace.name}</Text>
                  <Text style={styles.sheetMeta}>
                    {categoryLabel(activePlace.category)}
                    {activePlace.distance !== null && activePlace.distance !== undefined ? ` - ${activePlace.distance} km` : ""}
                  </Text>
                </View>
                <Pressable style={styles.sheetClose} onPress={() => setSheetOpen(false)}>
                  <Ionicons name="close" size={18} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScrollContent}>
                <PlaceCard
                  name={activePlace.name}
                  category={categoryLabel(activePlace.category)}
                  distance={activePlace.distance}
                  rating={activePlace.avg_rating ?? activePlace.rating}
                  imageUrl={toDisplayImageUrl(activePlace.image_urls?.[0])}
                  videoUrl={toDisplayMediaUrl(activePlace.video_urls?.[0])}
                />
                <PrimaryButton
                  label="Open Place Detail"
                  onPress={() => {
                    setSheetOpen(false);
                    navigation.navigate("PlaceDetail", { id: activePlace.id });
                  }}
                />
                <View style={styles.spacer} />
                <PrimaryButton
                  label={hasCoordinates(activePlace) ? "Get Directions" : "Location Unavailable"}
                  onPress={() => handleDirections(activePlace)}
                  variant="ghost"
                  disabled={!hasCoordinates(activePlace)}
                />
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  locationRow: {
    marginBottom: spacing.md,
  },
  locationButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  locationButtonText: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  locationMeta: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  locationError: {
    ...typography.body,
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  mapFrame: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  mapEyebrow: {
    ...typography.caption,
    color: colors.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  mapTitle: {
    ...typography.h2,
    color: colors.text,
    fontSize: 22,
  },
  mapSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    maxWidth: 250,
  },
  mapStats: {
    minWidth: 74,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },
  mapStatsValue: {
    ...typography.h2,
    color: colors.text,
    fontSize: 24,
  },
  mapStatsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0,
  },
  mapLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  legendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.68)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  legendText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  mapCanvas: {
    height: 360,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  spacer: {
    height: spacing.sm,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 24, 29, 0.34)",
  },
  sheet: {
    maxHeight: "82%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sheetTitleWrap: {
    flex: 1,
  },
  sheetEyebrow: {
    ...typography.caption,
    color: colors.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text,
  },
  sheetMeta: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetScrollContent: {
    paddingBottom: spacing.sm,
  },
});
