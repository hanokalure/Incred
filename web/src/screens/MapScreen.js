import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, Linking, Pressable } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import CategoryChip from "../components/CategoryChip";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { setCategory, clearCategory } from "../store/slices/placesSlice";

export default function MapScreen({ navigation }) {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.places.categories);
  const selected = useSelector((state) => state.places.selectedCategory);
  const places = useSelector((state) => state.places.places);

  const [userLocation, setUserLocation] = useState(null);
  const [activePlace, setActivePlace] = useState(null);

  const filtered = selected === "All" ? places : places.filter((p) => p.category === selected);

  useEffect(() => {
    if (Platform.OS === "web" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => console.log("Geolocation error:", err)
      );
    }
  }, []);

  const getMapUrl = () => {
    if (activePlace) {
      return `https://maps.google.com/maps?q=${activePlace.lat},${activePlace.lng}&z=15&output=embed`;
    }
    if (userLocation) {
      return `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=12&output=embed`;
    }
    return "https://maps.google.com/maps?q=Karnataka&z=7&output=embed";
  };

  const handleDirections = (place) => {
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : "";
    const destination = `${place.lat},${place.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;

    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <PageCard>
      <ScreenHeader title="Interactive Map" onBack={() => navigation.goBack()} />

      <View style={styles.mapWrap}>
        <iframe title="Karnataka Map" src={getMapUrl()} style={styles.iframe} />
      </View>

      <Text style={styles.section}>Discovery Points</Text>
      <View style={styles.row}>
        <CategoryChip label="All" selected={selected === "All"} onPress={() => dispatch(clearCategory())} />
        {categories.map((c) => (
          <CategoryChip key={c} label={c} selected={selected === c} onPress={() => dispatch(setCategory(c))} />
        ))}
      </View>

      <View style={styles.list}>
        {filtered.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.card, activePlace?.id === m.id && styles.activeCard]}
            onPress={() => setActivePlace(m)}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={styles.meta}>
                {m.category} • {m.distance} km away
              </Text>
              <Text style={styles.eta}>Estimated Arrival: {(m.distance * 8).toFixed(0)} mins</Text>
            </View>
            <PrimaryButton
              label="Go"
              onPress={() => handleDirections(m)}
              style={styles.goBtn}
              variant="outline"
            />
          </Pressable>
        ))}
      </View>

      {!userLocation && (
        <View style={styles.statusToast}>
          <Text style={styles.statusText}>Enable location for real-time ETA</Text>
        </View>
      )}
    </PageCard>
  );
}

const styles = StyleSheet.create({
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
  iframe: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
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
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    transition: "all 0.2s ease-in-out",
  },
  activeCard: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  eta: {
    ...typography.caption,
    color: colors.success,
    marginTop: 4,
    fontWeight: "700",
  },
  goBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 0,
  },
  statusToast: {
    position: "absolute",
    bottom: spacing.xl,
    alignSelf: "center",
    backgroundColor: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 100,
  },
  statusText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "600",
  },
});
