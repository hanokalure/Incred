import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, Polygon } from "react-native-maps";
import { colors } from "../theme/colors";

// ─── Default Fallback (Will be overridden by backend data) ─────────────────────
const DEFAULT_KARNATAKA_BOUNDARY = [
  { latitude: 18.47, longitude: 77.56 }, { latitude: 17.65, longitude: 77.62 },
  { latitude: 17.15, longitude: 77.42 }, { latitude: 17.02, longitude: 76.54 },
  { latitude: 16.55, longitude: 76.35 }, { latitude: 16.35, longitude: 75.82 },
  { latitude: 16.52, longitude: 75.12 }, { latitude: 15.82, longitude: 74.22 },
  { latitude: 15.25, longitude: 74.15 }, { latitude: 14.85, longitude: 74.05 },
  { latitude: 13.82, longitude: 74.52 }, { latitude: 13.12, longitude: 74.75 },
  { latitude: 12.72, longitude: 74.85 }, { latitude: 12.22, longitude: 75.12 },
  { latitude: 11.95, longitude: 75.82 }, { latitude: 11.55, longitude: 76.45 },
  { latitude: 11.85, longitude: 77.12 }, { latitude: 12.35, longitude: 77.42 },
  { latitude: 12.65, longitude: 78.42 }, { latitude: 13.55, longitude: 78.52 },
  { latitude: 13.95, longitude: 78.02 }, { latitude: 14.55, longitude: 77.52 },
  { latitude: 15.25, longitude: 77.22 }, { latitude: 15.85, longitude: 76.82 },
  { latitude: 16.25, longitude: 77.22 }, { latitude: 17.35, longitude: 77.12 },
];

const WORLD_MASK = [
  { latitude: 90, longitude: -180 }, { latitude: 90, longitude: 180 },
  { latitude: -90, longitude: 180 }, { latitude: -90, longitude: -180 },
];

const CATEGORY_COLORS = {
  restaurant: "#D35400", stay: "#2980B9", generational_shop: "#8E44AD",
  hidden_gem: "#16A085", tourist_place: "#B8860B", other: "#566573",
};

export default function NativePlacesMap({ places, regionBoundary, userLocation, activePlaceId, onSelectPlace, mapRef }) {
  // prioritize backend boundary if available
  const boundary = useMemo(() => regionBoundary || DEFAULT_KARNATAKA_BOUNDARY, [regionBoundary]);

  const initialRegion = useMemo(() => {
    return { latitude: 14.8, longitude: 75.8, latitudeDelta: 6.0, longitudeDelta: 6.0 };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
        onPress={() => onSelectPlace(null)}
      >
        <Polygon
          coordinates={WORLD_MASK}
          holes={[boundary]}
          fillColor="rgba(0,0,0,0.4)"
          strokeColor="transparent"
        />
        <Polygon
          coordinates={boundary}
          fillColor="transparent"
          strokeColor={colors.primary}
          strokeWidth={2}
        />

        {(places || []).map((place) => {
          const lat = Number(place.latitude);
          const lng = Number(place.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          return (
            <Marker
              key={String(place.id)}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => onSelectPlace(place)}
              pinColor={CATEGORY_COLORS[place.category] || CATEGORY_COLORS.other}
              tracksViewChanges={false}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { ...StyleSheet.absoluteFillObject },
});
