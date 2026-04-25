import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Image, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from 'expo-video';
import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaces } from "../services/placesApi";
import { requestCurrentLocation, attachDistanceToPlaces } from "../services/locationHelpers";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { label: "Food & Dining", value: "restaurant", icon: "restaurant-outline" },
  { label: "Hotels & Stays", value: "stay", icon: "bed-outline" },
  { label: "Hidden Gems", value: "hidden_gem", icon: "diamond-outline" },
  { label: "Heritage Sites", value: "tourist_place", icon: "camera-outline" },
  { label: "Artisans", value: "artisan", icon: "brush-outline" },
];

function SectionGroup({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function DiscoveryRow({ place, onPress, showDivider = true }) {
  const imageUrl = place.image_urls?.[0] ? toDisplayImageUrl(place.image_urls[0]) : null;
  const videoUrl = place.video_urls?.[0] ? toDisplayMediaUrl(place.video_urls[0]) : null;
  const player = useVideoPlayer(videoUrl, (p) => { p.loop = true; p.muted = true; p.play(); });

  return (
    <Pressable onPress={onPress} style={styles.discoveryRow}>
      <View style={styles.rowContent}>
        <View style={styles.mediaPreview}>
          {videoUrl ? (
            <VideoView style={styles.media} player={player} allowsFullscreen={false} contentFit="cover" />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.media} />
          ) : (
            <View style={styles.mediaPlaceholder}><Ionicons name="image-outline" size={20} color={colors.textMuted} /></View>
          )}
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={1}>{String(place.name)}</Text>
          <Text style={styles.rowMeta}>{place.distance ? String(place.distance) + " km away" : "Karnataka"}</Text>
        </View>
        <View style={styles.rowRating}>
          <Ionicons name="star" size={12} color="#F1C40F" />
          <Text style={styles.ratingText}>{String(place.avg_rating || place.rating || "5.0")}</Text>
        </View>
      </View>
      {showDivider && <View style={styles.rowDivider} />}
    </Pressable>
  );
}

export default function SearchFilterScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [query, setQuery] = useState("");
  const [showTopRated, setShowTopRated] = useState(false);

  useEffect(() => {
    fetchPlaces().then(setPlaces).catch(() => setPlaces([]));
    requestCurrentLocation().then(setUserLocation).catch(() => {});
  }, []);

  const visiblePlaces = useMemo(() => {
    let filtered = attachDistanceToPlaces(places, userLocation);
    if (!!selectedCategory) filtered = filtered.filter(p => p.category === selectedCategory);
    if (showTopRated) filtered = filtered.filter(p => Number(p.avg_rating || p.rating || 0) >= 4.5);
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      filtered = filtered.filter((p) => String(p?.name || "").toLowerCase().includes(q));
    }
    return filtered.sort((a,b) => (a.distance || 999) - (b.distance || 999));
  }, [places, userLocation, selectedCategory, query, showTopRated]);

  return (
    <PageCard>
      <ScreenHeader title="Discover" onBack={() => navigation.goBack()} />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search by name or keyword..." 
            value={query} 
            onChangeText={setQuery} 
            placeholderTextColor={colors.textMuted} 
          />
          {query.length > 0 ? (<Ionicons name="close-circle" size={18} color={colors.textMuted} onPress={() => setQuery("")} />) : null}
        </View>
      </View>

      <SectionGroup title="PURPOSE">
        {CATEGORIES.map((cat, idx) => (
          <Pressable 
            key={cat.value} 
            style={styles.groupItem} 
            onPress={() => setSelectedCategory(prev => prev === cat.value ? null : cat.value)}
          >
            <View style={styles.itemInner}>
              <Ionicons name={cat.icon} size={20} color={selectedCategory === cat.value ? colors.primary : colors.textSecondary} style={styles.itemIcon} />
              <Text style={[styles.itemTitle, selectedCategory === cat.value && { color: colors.primary, fontWeight: "800" }]}>{cat.label}</Text>
              {selectedCategory === cat.value ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />}
            </View>
            {idx < CATEGORIES.length - 1 && <View style={styles.itemDivider} />}
          </Pressable>
        ))}
      </SectionGroup>

      <SectionGroup title="PREFERENCES">
        <Pressable style={styles.groupItem} onPress={() => setShowTopRated(!showTopRated)}>
          <View style={styles.itemInner}>
            <Ionicons name="star-outline" size={20} color={colors.textSecondary} style={styles.itemIcon} />
            <Text style={styles.itemTitle}>Top Rated Only (4.5+)</Text>
            <View style={[styles.toggle, showTopRated && { backgroundColor: colors.primary }]}>
               <View style={[styles.toggleBall, showTopRated && { transform: [{ translateX: 16 }] }]} />
            </View>
          </View>
        </Pressable>
      </SectionGroup>

      <SectionGroup title={`RESULTS (${visiblePlaces.length})`}>
        {visiblePlaces.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>No matching spots found</Text></View>
        ) : (
          visiblePlaces.slice(0, 20).map((p, idx) => (
            <DiscoveryRow 
              key={p.id} 
              place={p} 
              showDivider={idx < Math.min(visiblePlaces.length, 20) - 1}
              onPress={() => navigation.navigate("PlaceDetail", { id: p.id })}
            />
          ))
        )}
      </SectionGroup>
      <View style={{ height: 40 }} />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  searchContainer: { marginBottom: spacing.lg },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, paddingHorizontal: 16, height: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, fontWeight: "500" },

  section: { marginBottom: spacing.xl },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.5, marginLeft: 4, marginBottom: 8 },
  groupCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  
  groupItem: { width: "100%" },
  itemInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  itemIcon: { marginRight: 16, width: 24, textAlign: "center" },
  itemTitle: { ...typography.body, flex: 1, color: colors.text, fontWeight: "600" },
  itemDivider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },

  discoveryRow: { width: "100%" },
  rowContent: { flexDirection: "row", alignItems: "center", padding: 12 },
  mediaPreview: { width: 60, height: 60, borderRadius: 12, backgroundColor: colors.accent, overflow: "hidden" },
  media: { ...StyleSheet.absoluteFillObject },
  mediaPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1, marginLeft: 14, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
  rowRating: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF9E7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: "800", color: "#9A7D0A" },
  rowDivider: { height: 1, backgroundColor: colors.border, marginLeft: 86 },

  toggle: { width: 40, height: 22, borderRadius: 11, backgroundColor: colors.border, padding: 2 },
  toggleBall: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 },

  empty: { padding: 40, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontWeight: "600" },
});
