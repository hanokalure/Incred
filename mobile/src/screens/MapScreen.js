import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, Linking } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { useDispatch, useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import CategoryChip from "../components/CategoryChip";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { setCategory, clearCategory } from "../store/slices/placesSlice";

import PageCard from "../components/PageCard";

export default function MapScreen({ navigation }) {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.places.categories);
  const selected = useSelector((state) => state.places.selectedCategory);
  const places = useSelector((state) => state.places.places);

  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  });

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [locationError, setLocationError] = useState("");

  const mapsApiKey = Constants?.expoConfig?.extra?.googleMapsApiKey;
  const hasGoogleMapsKey = !!mapsApiKey && !String(mapsApiKey).startsWith("YOUR_");

  const requestLocation = async () => {
    setLocationError("");
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      setLocationError("Location permission is blocked. Enable it in app settings and try again.");
      Linking.openSettings().catch(() => {});
      return;
    }

    const provider = await Location.getProviderStatusAsync();
    if (!provider.locationServicesEnabled) {
      setLocationError("Location services are turned off. Enable GPS/location services and try again.");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true,
    });
    setRegion((r) => ({
      ...r,
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    }));
  };

  useEffect(() => {
    requestLocation().catch((error) => {
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("denied")) {
        setLocationError("Location permission denied. Enable it in app settings and try again.");
        return;
      }
      if (message.toLowerCase().includes("timeout")) {
        setLocationError("Location request timed out. Move to an open area and try again.");
        return;
      }
      setLocationError(message || "Unable to access device location.");
    });
  }, []);

  const filtered = selected === "All" ? places : places.filter((p) => p.category === selected);

  const buildRoute = () => {
    if (!selectedPlace) return;
    setRouteInfo({
      distance: `${selectedPlace.distance} km`,
      eta: `${(selectedPlace.distance * 6).toFixed(0)} min`,
      note: "Directions API placeholder",
    });
  };

  return (
    <PageCard scroll={false} cardStyle={styles.cardOverride}>
      <ScreenHeader title="Interactive Map" onBack={() => navigation.goBack()} />

      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={true}
        >
          {filtered.map((m, idx) => (
            <Marker
              key={m.id}
              coordinate={{
                latitude: region.latitude + 0.01 * (idx + 1),
                longitude: region.longitude + 0.01 * (idx + 1),
              }}
              title={m.name}
              description={`${m.category} • ${m.distance} km`}
              onPress={() => {
                setSelectedPlace(m);
                setRouteInfo(null);
              }}
            />
          ))}
        </MapView>
      </View>
      {!hasGoogleMapsKey ? (
        <Text style={styles.locationError}>
          Google Maps API key is not configured (`mobile/app.json` still has placeholder).
        </Text>
      ) : null}
      {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
      <PrimaryButton label="Enable Location" onPress={() => requestLocation()} variant="ghost" />

      <Text style={styles.section}>Filter by Category</Text>
      <View style={styles.row}>
        <CategoryChip label="All" selected={selected === "All"} onPress={() => dispatch(clearCategory())} />
        {categories.map((c) => (
          <CategoryChip key={c} label={c} selected={selected === c} onPress={() => dispatch(setCategory(c))} />
        ))}
      </View>

      {selectedPlace ? (
        <View style={styles.placeCard}>
          <Text style={styles.name}>{selectedPlace.name}</Text>
          <Text style={styles.meta}>{selectedPlace.category} • {selectedPlace.distance} km</Text>
          <PrimaryButton
            label="Open Place Detail"
            onPress={() => navigation.navigate("PlaceDetail", { id: selectedPlace.id })}
          />
          <View style={styles.spacer} />
          <PrimaryButton label="Get Directions" onPress={buildRoute} variant="ghost" />

          {routeInfo && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle}>Optimal Route</Text>
              <Text style={styles.meta}>ETA: {routeInfo.eta} ({routeInfo.distance})</Text>
            </View>
          )}
        </View>
      ) : null}
    </PageCard>
  );
}

const styles = StyleSheet.create({
  cardOverride: {
    padding: 0,
  },
  mapWrap: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  map: {
    flex: 1,
  },
  section: {
    ...typography.h2,
    fontSize: 20,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  locationError: {
    ...typography.body,
    color: colors.error,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  placeCard: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
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
    marginBottom: spacing.md,
  },
  routeInfo: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 16,
    marginTop: spacing.md,
  },
  routeTitle: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: 4,
  },
  spacer: {
    height: spacing.sm,
  },
});
