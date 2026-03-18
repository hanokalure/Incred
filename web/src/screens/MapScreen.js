import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform, Pressable, Linking } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import CategoryChip from "../components/CategoryChip";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import LeafletPlacesMap from "../components/LeafletPlacesMap";
import PlaceBottomSheet from "../components/PlaceBottomSheet";
import { fetchPlaces } from "../services/placesApi";
import { getBrowserLocation } from "../utils/browserLocation";
import { getPlaceCategoryLabel } from "../constants/placeCategories";
import { useLanguage } from "../context/LanguageContext";

export default function MapScreen({ navigation }) {
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState(null);
  const [activePlace, setActivePlace] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [locationError, setLocationError] = useState("");

  const CATEGORY_ORDER = useMemo(
    () => ["restaurant", "generational_shop", "tourist_place", "hidden_gem", "stay"],
    []
  );

  const categoryCounts = useMemo(() => {
    const counts = {};
    (places || []).forEach((p) => {
      if (!p?.category) return;
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [places]);

  const categories = useMemo(() => {
    // Always show all known categories, even if count is 0.
    // This avoids "only one chip appears" when DB has only one category populated.
    const fromDb = new Set();
    (places || []).forEach((p) => {
      if (p?.category) fromDb.add(p.category);
    });
    const merged = new Set([...CATEGORY_ORDER, ...Array.from(fromDb)]);
    return Array.from(merged);
  }, [places, CATEGORY_ORDER]);

  useEffect(() => {
    fetchPlaces()
      .then((data) => setPlaces(data || []))
      .catch(() => setPlaces([]));
  }, []);

  const center = useMemo(() => {
    if (!userLocation) return [14.8, 75.8];
    return [userLocation.latitude, userLocation.longitude];
  }, [userLocation]);

  const resolveLocation = () => {
    setLocationError("");
    getBrowserLocation()
      .then((coords) => setUserLocation(coords))
      .catch((err) => setLocationError(err?.message || t("mapLocationError")));
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      resolveLocation();
    }
  }, []);

  const handleDirections = (place) => {
    if (!place?.latitude || !place?.longitude) return;
    const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : "";
    const destination = `${place.latitude},${place.longitude}`;
    const base = "https://www.google.com/maps/dir/?api=1";
    const url = origin
      ? `${base}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
      : `${base}&destination=${encodeURIComponent(destination)}`;
    Linking.openURL(url);
  };

  return (
    <PageCard>
      <ScreenHeader title="Interactive Map" onBack={() => navigation.goBack()} />

      <View style={styles.locationRow}>
        <Pressable onPress={resolveLocation} style={styles.locationButton}>
          <Text style={styles.locationButtonText}>
            {userLocation ? t("locationActive") : t("centerOnMe")}
          </Text>
        </Pressable>
        {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
      </View>

      <View style={styles.mapWrap}>
        <LeafletPlacesMap
          places={places}
          selectedCategory={selectedCategory}
          center={center}
          userLocation={userLocation}
          onSelectPlace={(p) => setActivePlace(p)}
        />
      </View>

      <Text style={styles.section}>Filter</Text>
      <View style={styles.row}>
        <CategoryChip
          label="All"
          selected={selectedCategory === "All"}
          onPress={() => setSelectedCategory("All")}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c}
            label={`${getPlaceCategoryLabel(c)}${categoryCounts[c] ? ` (${categoryCounts[c]})` : ""}`}
            selected={selectedCategory === c}
            onPress={() => setSelectedCategory(c)}
            disabled={!categoryCounts[c]}
          />
        ))}
      </View>

      <PlaceBottomSheet
        place={activePlace}
        onClose={() => setActivePlace(null)}
        onOpenDetails={() => {
          if (!activePlace) return;
          navigation.navigate("PlaceDetail", { id: activePlace.id });
        }}
        onDirections={() => handleDirections(activePlace)}
      />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  locationRow: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  locationButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  locationError: {
    color: colors.error,
    fontSize: 12,
  },
  mapWrap: {
    height: 450,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.xl,
    boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
  },
  section: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
});
