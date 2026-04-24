import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Alert, Platform, Pressable, Animated, ScrollView, StatusBar, Dimensions, FlatList, Modal } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import AppVideo from "../components/AppVideo";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaceDetails, submitPlaceMedia } from "../services/placesApi";
import { getAuthProfile } from "../services/authStore";
import { fetchSavedPlaces, removeSavedPlace, savePlace } from "../services/savedApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { uploadPlaceImage, uploadPlaceVideo } from "../services/uploadsApi";

const { width: W, height: H } = Dimensions.get("window");
const HERO_H = H * 0.45;

function InfoGroup({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{String(title)}</Text>
      <View style={styles.groupCard}>
        {children}
      </View>
    </View>
  );
}

function InfoItem({ icon, label, value, isLast }) {
  if (!value) return null;
  return (
    <View style={styles.itemWrapper}>
      <View style={styles.itemRow}>
        <View style={styles.itemIconWrap}><Ionicons name={icon} size={16} color={colors.primary} /></View>
        <View style={styles.itemText}><Text style={styles.itemLabel}>{String(label)}</Text><Text style={styles.itemValue}>{String(value)}</Text></View>
      </View>
      {!isLast && <View style={styles.itemDivider} />}
    </View>
  );
}

export default function PlaceDetailScreen({ navigation, route }) {
  const [role, setRole] = useState("user");
  const placeId = Number(route?.params?.id) || null;
  const [place, setPlace] = useState(null);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoStatus, setPhotoStatus] = useState("idle");
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getAuthProfile().then((p) => setRole(p?.role || "user")).catch(() => setRole("user"));
    if (!placeId) return;
    setLoading(true);
    Promise.all([fetchPlaceDetails(placeId).catch(() => null), fetchSavedPlaces().catch(() => [])]).then(([data, favorites]) => {
      setPlace(data);
      const match = (favorites || []).find((f) => f.place_id === placeId);
      setFavoriteId(match ? match.id : null);
    }).finally(() => setLoading(false));
  }, [placeId]);

  const handleToggleSaved = async () => {
    if (!placeId) return;
    try {
      if (favoriteId) { await removeSavedPlace(favoriteId); setFavoriteId(null); }
      else { await savePlace(placeId); setFavoriteId(true); }
    } catch (e) { Alert.alert("Error", "Action failed."); }
  };

  const heroScale = scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.2, 1], extrapolate: "clamp" });
  const headerOpacity = scrollY.interpolate({ inputRange: [0, HERO_H - 100], outputRange: [0, 1], extrapolate: "clamp" });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent />
      
      {/* 1. STICKY HEADER (Glassmorphism effect) */}
      <View style={styles.navBar}>
        <Pressable style={styles.navBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Animated.View style={[styles.navTitleWrap, { opacity: headerOpacity }]}>
           <Text style={styles.navTitle} numberOfLines={1}>{String(place?.name || "")}</Text>
        </Animated.View>
        <Pressable style={[styles.navBtn, favoriteId && { backgroundColor: colors.primary }]} onPress={handleToggleSaved}>
          <Ionicons name={favoriteId ? "bookmark" : "bookmark-outline"} size={22} color="#fff" />
        </Pressable>
      </View>

      {/* 2. PARALLAX HERO */}
      <Animated.View style={[styles.heroLayer, { transform: [{ scale: heroScale }] }]}>
        {place?.image_urls?.length ? (
          <FlatList
            data={place.image_urls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => setActiveHeroIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item }) => <Image source={{ uri: toDisplayImageUrl(item) }} style={{ width: W, height: HERO_H }} />}
          />
        ) : <View style={styles.heroFallback} />}
        <View style={styles.heroGradient} />
      </Animated.View>

      <Animated.ScrollView 
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: HERO_H - 40 }} />
        <View style={styles.content}>
          <View style={styles.dragHandle} />
          
          <Text style={styles.placeName}>{String(place?.name || "Loading...")}</Text>
          <View style={styles.vitalsRow}>
            <View style={styles.vital}><Ionicons name="star" size={14} color="#F1C40F" /><Text style={styles.vitalText}>{String(place?.avg_rating || "5.0")}</Text></View>
            <View style={styles.vitalDivider} />
            <Text style={styles.vitalText}>{String(place?.category || "Place").toUpperCase()}</Text>
            <View style={styles.vitalDivider} />
            <Text style={styles.vitalText}>INDIA</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OVERVIEW</Text>
            <Text style={styles.description}>{String(place?.description || "Explore the wonders of this unique location in the heart of Karnataka.")}</Text>
          </View>

          {place?.restaurant_details && (
            <InfoGroup title="RESTAURANT DETAILS">
              <InfoItem icon="restaurant-outline" label="Cuisine" value={place.restaurant_details.cuisine} />
              <InfoItem icon="wallet-outline" label="Price" value={place.restaurant_details.price_range} />
              <InfoItem icon="star-outline" label="Must Try" value={place.restaurant_details.must_try} isLast />
            </InfoGroup>
          )}

          {place?.stay_details && (
            <InfoGroup title="STAY AMENITIES">
              <InfoItem icon="bed-outline" label="Type" value={place.stay_details.stay_type} />
              <InfoItem icon="checkmark-done-outline" label="Facilities" value={place.stay_details.amenities?.join(", ")} isLast />
            </InfoGroup>
          )}

          {place?.video_urls?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>EXPERIENCE IN MOTION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videoScroll}>
                {place.video_urls.map((url, i) => (
                  <View key={i} style={styles.videoCard}>
                    <AppVideo source={toDisplayMediaUrl(url)} style={styles.full} muted loop autoPlay />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* 3. STICKY ACTION DOCK */}
      <View style={styles.actionDock}>
        <Pressable style={styles.dockBtnSecondary} onPress={() => navigation.navigate("ReviewsList", { id: placeId })}>
          <Ionicons name="chatbubbles-outline" size={20} color={colors.text} />
          <Text style={styles.dockBtnText}>Reviews</Text>
        </Pressable>
        <Pressable style={styles.dockBtnPrimary} onPress={() => navigation.navigate("Map")}>
          <Text style={styles.dockBtnTextPrimary}>GET DIRECTIONS</Text>
          <Ionicons name="navigate" size={20} color="#1A1A1A" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  full: { width: "100%", height: "100%" },
  
  navBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 40, height: 110 },
  navBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: "center", justifyContent: "center" },
  navTitleWrap: { flex: 1, marginHorizontal: 15, height: 44, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 22, justifyContent: "center", paddingHorizontal: 20 },
  navTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },

  heroLayer: { height: HERO_H, position: "absolute", top: 0, left: 0, right: 0 },
  heroFallback: { flex: 1, backgroundColor: "#1A1A1A" },
  heroGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 150, backgroundColor: 'rgba(0,0,0,0.4)' },

  content: { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: H },
  dragHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 24 },
  
  placeName: { ...typography.h1, fontSize: 28, color: colors.text, marginBottom: 12 },
  vitalsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 30 },
  vital: { flexDirection: "row", alignItems: "center", gap: 4 },
  vitalText: { fontSize: 13, fontWeight: "800", color: colors.textSecondary },
  vitalDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border },

  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: "900", color: colors.textMuted, letterSpacing: 1.5, marginBottom: 16 },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 26, fontWeight: "500" },

  groupCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  itemWrapper: { width: "100%" },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  itemIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase" },
  itemValue: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 2 },
  itemDivider: { height: 1, backgroundColor: colors.border, marginLeft: 68 },

  videoScroll: { marginHorizontal: -24, paddingHorizontal: 24 },
  videoCard: { width: 140, height: 200, borderRadius: 16, overflow: "hidden", marginRight: 16, backgroundColor: "#000" },

  actionDock: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", gap: 12, elevation: 20 },
  dockBtnPrimary: { flex: 2, height: 56, backgroundColor: colors.primary, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  dockBtnSecondary: { flex: 1, height: 56, backgroundColor: colors.background, borderRadius: 18, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  dockBtnText: { fontSize: 14, fontWeight: "800", color: colors.text },
  dockBtnTextPrimary: { fontSize: 14, fontWeight: "900", color: "#1A1A1A" },
});
