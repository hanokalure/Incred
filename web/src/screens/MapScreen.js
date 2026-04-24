import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform, Pressable, Linking, Dimensions, FlatList, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import LeafletPlacesMap from "../components/LeafletPlacesMap";
import { fetchPlaces } from "../services/placesApi";
import { getBrowserLocation } from "../utils/browserLocation";
import { useLanguage } from "../context/LanguageContext";
import { toDisplayImageUrl } from "../services/mediaUrl";

const { width: W, height: H } = Dimensions.get("window");

export default function MapScreen({ navigation }) {
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState(null);
  const [activePlace, setActivePlace] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPlaces().then(setPlaces).catch(() => setPlaces([]));
    if (Platform.OS === "web") {
      getBrowserLocation().then(setUserLocation).catch(() => {});
    }
  }, []);

  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [places, selectedCategory, searchQuery]);

  const center = useMemo(() => {
    if (activePlace) return [activePlace.latitude, activePlace.longitude];
    if (userLocation) return [userLocation.latitude, userLocation.longitude];
    return [14.8, 75.8];
  }, [activePlace, userLocation]);

  return (
    <View style={styles.container}>

      {/* 1. FULL VIEWPORT MAP */}
      <View style={styles.mapContainer}>
        <LeafletPlacesMap
          places={filteredPlaces}
          selectedCategory={selectedCategory}
          center={center}
          userLocation={userLocation}
          onSelectPlace={setActivePlace}
        />
      </View>

      {/* 2. FLOATING CONTROL RAIL (Top) */}
      <View style={styles.topRail}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search Karnataka...</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {["All", "restaurant", "stay", "tourist_place", "hidden_gem"].map((cat) => (
            <Pressable 
              key={cat} 
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
                {cat === "All" ? "All Places" : cat.replace('_', ' ').toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 3. DISCOVERY SIDEBAR (Desktop Only) */}
      {W > 900 && (
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Nearby Discoveries</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredPlaces.map(p => (
              <Pressable 
                key={p.id} 
                style={[styles.sideCard, activePlace?.id === p.id && styles.sideCardActive]}
                onPress={() => setActivePlace(p)}
              >
                <Image source={{ uri: toDisplayImageUrl(p.image_urls?.[0]) }} style={styles.sideMedia} />
                <View style={styles.sideInfo}>
                  <Text style={styles.sideTitle} numberOfLines={1}>{String(p.name)}</Text>
                  <Text style={styles.sideMeta}>{String(p.category || "Place").toUpperCase()}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 4. SYNCED CAROUSEL (Bottom) */}
      <View style={styles.carouselWrap}>
        <FlatList
          data={filteredPlaces}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}
          renderItem={({ item }) => (
            <Pressable 
              style={[styles.mapCard, activePlace?.id === item.id && styles.mapCardActive]}
              onPress={() => {
                setActivePlace(item);
                navigation.navigate("PlaceDetail", { id: item.id });
              }}
            >
              <Image source={{ uri: toDisplayImageUrl(item.image_urls?.[0]) }} style={styles.cardMedia} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{String(item.name)}</Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="star" size={10} color="#F1C40F" />
                  <Text style={styles.cardRating}>{String(item.avg_rating || "5.0")}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mapContainer: { ...StyleSheet.absoluteFillObject },

  topRail: { position: "absolute", top: 20, left: 20, right: 20, flexDirection: "row", alignItems: "center", gap: 15, zIndex: 100 },
  backBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  searchBar: { flex: 1, height: 50, backgroundColor: "#fff", borderRadius: 25, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 12, elevation: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, maxWidth: 300 },
  searchPlaceholder: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  
  catScroll: { flex: 1, maxHeight: 50 },
  catChip: { paddingHorizontal: 20, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center", marginRight: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 12, fontWeight: "800", color: colors.text },
  catTextActive: { color: "#fff" },

  sidebar: { position: "absolute", top: 90, left: 20, bottom: 180, width: 320, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 32, padding: 24, elevation: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, zIndex: 90 },
  sidebarTitle: { fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: 20 },
  sideCard: { flexDirection: "row", alignItems: "center", marginBottom: 15, padding: 10, borderRadius: 16 },
  sideCardActive: { backgroundColor: colors.accent },
  sideMedia: { width: 50, height: 50, borderRadius: 12, backgroundColor: colors.border },
  sideInfo: { flex: 1, marginLeft: 15 },
  sideTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
  sideMeta: { fontSize: 10, color: colors.textMuted, fontWeight: "700", marginTop: 2 },

  carouselWrap: { position: "absolute", bottom: 30, left: 0, right: 0, zIndex: 100 },
  mapCard: { width: 160, backgroundColor: "#fff", borderRadius: 24, overflow: "hidden", elevation: 15, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 15, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  mapCardActive: { borderColor: colors.primary, borderWidth: 2 },
  cardMedia: { width: "100%", height: 100, backgroundColor: colors.border },
  cardInfo: { padding: 12 },
  cardTitle: { fontSize: 13, fontWeight: "800", color: colors.text },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardRating: { fontSize: 11, fontWeight: "800", color: colors.textSecondary },
});
