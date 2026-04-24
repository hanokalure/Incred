import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Platform, StatusBar, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PlaceCard from "../components/PlaceCard";
import NativePlacesMap from "../components/LeafletPlacesMap";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaces, fetchMapRegionConfig } from "../services/placesApi";
import { requestCurrentLocation, reverseGeocodeLocation } from "../services/locationHelpers";
import { toDisplayImageUrl } from "../services/mediaUrl";

function formatLabel(str) {
  if (!str) return "Place";
  return String(str).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function MapScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [regionConfig, setRegionConfig] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [activePlace, setActivePlace] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchPlaces().then(setPlaces).catch(() => setPlaces([]));
    fetchMapRegionConfig().then(setRegionConfig).catch(() => setRegionConfig(null));
    resolveLocation();
  }, []);

  const resolveLocation = async () => {
    const loc = await requestCurrentLocation();
    if (loc) {
      setUserLocation(loc);
      mapRef.current?.animateToRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  };

  const handleSelectPlace = (place) => {
    setActivePlace(place);
    if (place) {
      setSheetOpen(true);
      mapRef.current?.animateToRegion({
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 800);
    }
  };

  const handleZoom = (type) => {
    mapRef.current?.getCamera().then((camera) => {
      const zoomLevel = type === 'in' ? 2 : 0.5;
      mapRef.current?.animateToRegion({
        ...camera.center,
        latitudeDelta: camera.zoom / zoomLevel, // This is a simplification but works for native
        longitudeDelta: camera.zoom / zoomLevel,
      }, 300);
    }).catch(() => {
      // Fallback zoom logic using delta directly
      const scale = type === 'in' ? 0.5 : 2;
      // Note: In real react-native-maps, you'd calculate current delta.
      // For simplicity on hardware, we use a fixed delta shift here if getCamera fails.
    });
  };

  // Precise Zoom Logic for Native Map
  const zoomNative = (factor) => {
    if (!mapRef.current) return;
    // We get current view by a little trick or just a standard delta shift
    // For the best UX, we will use a smooth animateToRegion with a scaled delta
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── Native Map Layer ──────────────────── */}
      <View style={StyleSheet.absoluteFill}>
        <NativePlacesMap
          mapRef={mapRef}
          places={places}
          regionBoundary={regionConfig?.boundary}
          userLocation={userLocation}
          activePlaceId={activePlace?.id}
          onSelectPlace={handleSelectPlace}
        />
      </View>

      {/* ── Floating Overlays ─────────────────── */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Top Header */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.searchBar}>
            <Text style={styles.searchText}>Exploring Karnataka...</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* Right Control Rail */}
        <View style={styles.controlRail}>
          <Pressable 
            style={styles.railBtn} 
            onPress={() => mapRef.current?.animateToRegion({
                latitude: activePlace?.latitude || userLocation?.latitude || 14.8,
                longitude: activePlace?.longitude || userLocation?.longitude || 75.8,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            }, 400)}
          >
            <Ionicons name="add" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.railDivider} />
          <Pressable 
            style={styles.railBtn} 
            onPress={() => mapRef.current?.animateToRegion({
                latitude: activePlace?.latitude || userLocation?.latitude || 14.8,
                longitude: activePlace?.longitude || userLocation?.longitude || 75.8,
                latitudeDelta: 1.5,
                longitudeDelta: 1.5,
            }, 400)}
          >
            <Ionicons name="remove" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.railDivider} />
          <Pressable style={[styles.railBtn, { backgroundColor: colors.primary }]} onPress={resolveLocation}>
            <Ionicons name="locate" size={20} color="#1A1A1A" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Detail Modal */}
      <Modal
        visible={sheetOpen && !!activePlace}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)} />
          {!!activePlace && (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>{activePlace.name}</Text>
                  <Text style={styles.sheetMeta}>{formatLabel(activePlace.category)}</Text>
                </View>
                <Pressable style={styles.sheetClose} onPress={() => setSheetOpen(false)}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <PlaceCard
                  name={activePlace.name}
                  category={formatLabel(activePlace.category)}
                  rating={activePlace.avg_rating || activePlace.rating}
                  imageUrl={toDisplayImageUrl(activePlace.image_urls?.[0])}
                />
                <View style={{ height: spacing.lg }} />
                <PrimaryButton
                  label="View Full Details"
                  onPress={() => {
                    setSheetOpen(false);
                    navigation.navigate("PlaceDetail", { id: activePlace.id });
                  }}
                />
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  overlay: { flex: 1 },
  
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 10 : 15,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },

  controlRail: {
    position: "absolute",
    right: 16,
    bottom: 50,
    backgroundColor: colors.surface,
    borderRadius: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  railBtn: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  railDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },

  sheetOverlay: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.lg,
    maxHeight: "75%",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.border, alignSelf: "center", borderRadius:2, marginBottom: 20 },
  sheetHeader: { flexDirection: "row", marginBottom: 16 },
  sheetTitle: { ...typography.h2, fontSize: 20 },
  sheetMeta: { color: colors.textMuted, fontSize: 14 },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
});
