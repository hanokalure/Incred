import { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, StatusBar, Image, Dimensions, FlatList, Platform, SafeAreaView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LeafletPlacesMap from "../components/LeafletPlacesMap";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaces } from "../services/placesApi";
import { requestCurrentLocation } from "../services/locationHelpers";
import { toDisplayImageUrl } from "../services/mediaUrl";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function SmallPlaceCard({ item, isActive, onPress }) {
  return (
    <Pressable style={[styles.smallCard, isActive && styles.activeCard]} onPress={onPress}>
      <View style={styles.smallCardMedia}>
        {item.image_urls?.[0] ? (
          <Image source={{ uri: toDisplayImageUrl(item.image_urls[0]) }} style={styles.fullMedia} />
        ) : (
          <View style={styles.mediaPlaceholder}><Ionicons name="image-outline" size={20} color={colors.textMuted} /></View>
        )}
      </View>
      <View style={styles.smallCardInfo}>
        <Text style={styles.smallCardTitle} numberOfLines={1}>{String(item.name)}</Text>
        <View style={styles.smallCardMeta}>
          <Ionicons name="star" size={10} color="#F1C40F" />
          <Text style={styles.smallCardRating}>{String(item.avg_rating || "5.0")}</Text>
        </View>
      </View>
      {isActive && <View style={styles.activeBadge}><Ionicons name="checkmark-circle" size={12} color="#fff" /></View>}
    </Pressable>
  );
}

export default function MapScreen({ navigation }) {
  const [allPlaces, setAllPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [activePlace, setActivePlace] = useState(null);
  const mapRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    fetchPlaces().then(setAllPlaces).catch(() => setAllPlaces([]));
    requestCurrentLocation().then(setUserLocation).catch(() => {});
  }, []);

  // Filter logic
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return allPlaces;
    return allPlaces.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allPlaces, searchQuery]);

  const handleSelectPlace = (place) => {
    setActivePlace(place);
    if (place) {
      mapRef.current?.animateToRegion({
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      const index = filteredPlaces.findIndex(p => p.id === place.id);
      if (index !== -1) {
        listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={StyleSheet.absoluteFill}>
        <LeafletPlacesMap
          mapRef={mapRef}
          places={filteredPlaces}
          userLocation={userLocation}
          onSelectPlace={handleSelectPlace}
        />
      </View>

      <SafeAreaView style={styles.topBarWrapper} pointerEvents="box-none">
        <View style={styles.topOverlay}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.searchHub}>
            <Ionicons name="search-outline" size={18} color={colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search places..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.rightRail}>
        <Pressable style={styles.railBtn} onPress={() => mapRef.current?.zoomIn()}>
          <Ionicons name="add" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.railDivider} />
        <Pressable style={styles.railBtn} onPress={() => mapRef.current?.zoomOut()}>
          <Ionicons name="remove" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.railDivider} />
        <Pressable style={[styles.railBtn, { backgroundColor: colors.primary }]} onPress={() => {
          if (userLocation) mapRef.current?.animateToRegion({ latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.05 });
        }}>
          <Ionicons name="locate" size={20} color="#1A1A1A" />
        </Pressable>
      </View>

      <View style={styles.carouselContainer}>
        <FlatList
          ref={listRef}
          data={filteredPlaces}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.carouselContent}
          snapToInterval={152}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <SmallPlaceCard 
              item={item} 
              isActive={activePlace?.id === item.id}
              onPress={() => {
                handleSelectPlace(item);
                setTimeout(() => navigation.navigate("PlaceDetail", { id: item.id }), 400);
              }} 
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBarWrapper: { position: "absolute", top: 0, left: 0, right: 0 },
  topOverlay: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 12, marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 },
  backBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, elevation: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  searchHub: { flex: 1, height: 50, borderRadius: 25, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 10, borderWidth: 1, borderColor: colors.border, elevation: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text, paddingVertical: 0 },

  rightRail: { position: "absolute", right: 20, top: (SCREEN_HEIGHT / 2) - 100, backgroundColor: colors.surface, borderRadius: 25, borderWidth: 1, borderColor: colors.border, elevation: 10, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  railBtn: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  railDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 10 },

  carouselContainer: { position: "absolute", bottom: Platform.OS === 'ios' ? 40 : 20, left: 0, right: 0 },
  carouselContent: { paddingHorizontal: 20, gap: 12, paddingBottom: 15, paddingTop: 10 },
  smallCard: { width: 140, backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, elevation: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8 },
  activeCard: { borderColor: colors.primary, borderWidth: 2, transform: [{ scale: 1.12 }], elevation: 20, shadowOpacity: 0.3, shadowRadius: 15 },
  smallCardMedia: { width: "100%", height: 90, backgroundColor: colors.accent },
  fullMedia: { width: "100%", height: "100%" },
  mediaPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  smallCardInfo: { padding: 8 },
  smallCardTitle: { fontSize: 13, fontWeight: "800", color: colors.text },
  smallCardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  smallCardRating: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  activeBadge: { position: "absolute", top: 8, right: 8, backgroundColor: colors.primary, borderRadius: 10, padding: 2 },
});
