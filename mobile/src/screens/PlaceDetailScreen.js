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
const HERO_H = H * 0.4;

function InfoRow({ icon, iconColor = "#566573", iconBg = "#F2F3F4", label, value, isLast }) {
  if (!value) return null;
  return (
    <View style={styles.infoRowWrapper}>
      <View style={styles.infoRow}>
        <View style={[styles.infoIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={15} color={iconColor} /></View>
        <View style={styles.infoText}><Text style={styles.infoLabel}>{String(label)}</Text><Text style={styles.infoValue}>{String(value)}</Text></View>
      </View>
      {isLast ? null : <View style={styles.infoRowDivider} />}
    </View>
  );
}

function ActionBtn({ icon, label, onPress, primary }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionBtn, primary ? styles.actionBtnPrimary : null, pressed ? { opacity: 0.75 } : null]}>
      <Ionicons name={icon} size={18} color={primary ? "#1A1A1A" : colors.text} />
      <Text style={[styles.actionBtnText, primary ? styles.actionBtnTextPrimary : null]}>{String(label)}</Text>
    </Pressable>
  );
}

export default function PlaceDetailScreen({ navigation, route }) {
  const [role, setRole] = useState("user");
  const placeId = Number(route?.params?.id) || null;
  const [place, setPlace] = useState(null);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoStatus, setPhotoStatus] = useState("idle");
  const [photoError, setPhotoError] = useState("");
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const isSaved = !!favoriteId;
  const mediaSubmitted = photoStatus === "submitted" || photoStatus === "submitted-video";
  const images = place?.image_urls || [];

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
      if (favoriteId) {
        await removeSavedPlace(favoriteId);
        setFavoriteId(null);
      } else {
        await savePlace(placeId);
        setFavoriteId(true);
      }
    } catch (e) { Alert.alert("Error", e?.message || "Action failed."); }
  };

  const handleMediaAdd = async (type) => {
    setMediaMenuOpen(false); setPhotoError("");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos, quality: 0.8 });
    if (res.canceled || !res.assets?.length) return;
    setPhotoStatus("uploading");
    try {
      const upload = type === 'image' ? await uploadPlaceImage(res.assets[0]) : await uploadPlaceVideo(res.assets[0]);
      await submitPlaceMedia(placeId, type, upload.public_url);
      setPhotoStatus("submitted");
    } catch (e) { setPhotoStatus("idle"); setPhotoError(e?.message || "Upload failed."); }
  };

  const heroScale = scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.2, 1], extrapolate: "clamp" });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.floatingBar}>
        <Pressable style={styles.floatBtn} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={20} color="#fff" /></Pressable>
        <Pressable style={[styles.floatBtn, isSaved ? styles.floatBtnActive : null]} onPress={handleToggleSaved}><Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color="#fff" /></Pressable>
      </View>

      <Animated.View style={[styles.heroContainer, { transform: [{ scale: heroScale }] }]}>
        {images.length > 0 ? (
          <View style={styles.heroInner}>
            <FlatList data={images} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={(e) => { setActiveHeroIndex(Math.round(e.nativeEvent.contentOffset.x / W)); }} keyExtractor={(_, i) => String(i)} renderItem={({ item, index }) => (<Pressable onPress={() => { setViewerIndex(index); setIsViewerVisible(true); }}><Image source={{ uri: toDisplayImageUrl(item) }} style={{ width: W, height: HERO_H }} resizeMode="cover" /></Pressable>)} />
            <View style={styles.photoBadge}><Ionicons name="camera" size={12} color="#fff" style={{ marginRight: 4 }} /><Text style={styles.photoBadgeText}>{String(activeHeroIndex + 1)} / {String(images.length)}</Text></View>
            <View style={styles.dotsContainer}>{images.map((_, i) => (<View key={i} style={[styles.dot, activeHeroIndex === i ? styles.dotActive : null]} />))}</View>
          </View>
        ) : (
          <View style={styles.heroFallback}><Ionicons name="image-outline" size={64} color="rgba(255,255,255,0.3)" /></View>
        )}
      </Animated.View>

      <Animated.ScrollView style={styles.scroll} onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <View style={{ height: HERO_H - 30 }} />
        <View style={styles.contentCard}>
          <View style={styles.dragHandle} />
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeName}>{loading ? "Loading..." : String(place?.name || "Place Name")}</Text>
              <View style={styles.chipRow}>
                <View style={styles.catPill}><Text style={styles.catPillText}>{String(place?.category || "Place").toUpperCase()}</Text></View>
                {place?.avg_rating ? (<View style={styles.ratingPill}><Ionicons name="star" size={13} color={colors.primary} /><Text style={styles.ratingText}>{String(place.avg_rating)}</Text></View>) : null}
              </View>
              {!!photoError || !!mediaSubmitted ? (
                <View style={[styles.statusChip, mediaSubmitted ? styles.statusChipSuccess : null]}>
                  <Ionicons name={mediaSubmitted ? "checkmark-circle" : "alert-circle"} size={14} color={mediaSubmitted ? colors.success : colors.error} />
                  <Text style={[styles.statusText, mediaSubmitted ? { color: colors.success } : null]}>{photoError ? String(photoError) : (mediaSubmitted ? "Submitted for approval" : "")}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {place?.address ? (<View style={styles.addressRow}><Ionicons name="location-sharp" size={16} color={colors.primary} /><Text style={styles.addressText}>{String(place.address)}</Text></View>) : null}

          <View style={styles.section}><Text style={styles.sectionTitle}>Overview</Text><Text style={styles.descText}>{String(place?.description || "No description available yet.")}</Text></View>

          {place?.restaurant_details ? (
            <View style={styles.section}><Text style={styles.sectionTitle}>Restaurant Highlights</Text>
              <View style={styles.groupCard}>
                <InfoRow icon="restaurant" label="Cuisine" value={place.restaurant_details.cuisine} />
                <InfoRow icon="wallet" label="Price Range" value={place.restaurant_details.price_range} />
                <InfoRow icon="ribbon" label="Must Try" value={place.restaurant_details.must_try} isLast />
              </View>
            </View>
          ) : null}

          {place?.stay_details ? (
            <View style={styles.section}><Text style={styles.sectionTitle}>Stay Information</Text>
              <View style={styles.groupCard}>
                <InfoRow icon="bed-outline" label="Type" value={place.stay_details.stay_type} />
                <InfoRow icon="cash-outline" label="Price / Night" value={place.stay_details.price_per_night ? "₹" + String(place.stay_details.price_per_night) : null} />
                <InfoRow icon="checkmark-circle-outline" label="Amenities" value={place.stay_details.amenities?.join(", ")} isLast />
              </View>
            </View>
          ) : null}

          {place?.video_urls?.length ? (
            <View style={styles.section}><Text style={styles.sectionTitle}>Experience (Videos)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videoScroll}>
                {place.video_urls.map((url, i) => (<View key={i} style={styles.videoCard}><AppVideo source={toDisplayMediaUrl(url)} style={styles.video} contentFit="cover" muted loop autoPlay nativeControls={false} /></View>))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <ActionBtn icon="map" label="Directions" onPress={() => navigation.navigate("Map")} />
            <ActionBtn icon="chatbubbles" label="Reviews" onPress={() => navigation.navigate("ReviewsList", { id: placeId })} />
            <ActionBtn icon={isSaved ? "bookmark" : "bookmark-outline"} label={isSaved ? "Saved" : "Save"} primary={isSaved} onPress={handleToggleSaved} />
          </View>
          <View style={{ height: 40 }} />
        </View>
      </Animated.ScrollView>

      <Modal visible={isViewerVisible} transparent animationType="fade">
        <View style={styles.viewerContainer}>
          <Pressable style={styles.viewerClose} onPress={() => setIsViewerVisible(false)}><Ionicons name="close" size={30} color="#fff" /></Pressable>
          <FlatList data={images} horizontal pagingEnabled initialScrollIndex={viewerIndex} getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })} keyExtractor={(_, i) => String(i)} renderItem={({ item }) => (<View style={styles.viewerSlide}><Image source={{ uri: toDisplayImageUrl(item) }} style={styles.viewerImage} resizeMode="contain" /></View>)} />
        </View>
      </Modal>

      {role !== "admin" ? (<Pressable style={styles.fab} onPress={() => setMediaMenuOpen(true)}><Ionicons name="add" size={28} color="#1A1A1A" /></Pressable>) : null}

      <Modal visible={mediaMenuOpen} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setMediaMenuOpen(false)}>
          <View style={styles.sheet}><Text style={styles.sheetTitle}>Add to this place</Text>
            <View style={styles.sheetOptions}>
              <Pressable style={styles.sheetBtn} onPress={() => handleMediaAdd('image')}><View style={[styles.sheetIcon, { backgroundColor: "#FEF5E7" }]}><Ionicons name="image" size={24} color="#D35400" /></View><Text style={styles.sheetText}>Photo</Text></Pressable>
              <Pressable style={styles.sheetBtn} onPress={() => handleMediaAdd('video')}><View style={[styles.sheetIcon, { backgroundColor: "#EBF5FB" }]}><Ionicons name="videocam" size={24} color="#2980B9" /></View><Text style={styles.sheetText}>Video</Text></Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  heroContainer: { height: HERO_H, position: "absolute", top: 0, left: 0, right: 0 },
  heroInner: { flex: 1 },
  heroFallback: { flex: 1, backgroundColor: "#2C2C2C", justifyContent: "center", alignItems: "center" },
  photoBadge: { position: "absolute", bottom: 50, right: 20, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center" },
  photoBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  dotsContainer: { position: "absolute", bottom: 50, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { width: 18, backgroundColor: colors.primary },
  floatingBar: { position: "absolute", top: Platform.OS === "ios" ? 60 : 40, left: 20, right: 20, zIndex: 100, flexDirection: "row", justifyContent: "space-between" },
  floatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  floatBtnActive: { backgroundColor: colors.primary },
  scroll: { flex: 1 },
  contentCard: { backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10 },
  dragHandle: { width: 40, height: 5, backgroundColor: "#DDD", borderRadius: 3, alignSelf: "center", marginBottom: 20 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 },
  placeName: { fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 8, letterSpacing: -0.5 },
  chipRow: { flexDirection: "row", gap: 10 },
  catPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  catPillText: { fontSize: 11, fontWeight: "800", color: colors.primary },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, borderRadius: 20 },
  ratingText: { fontSize: 13, fontWeight: "800", color: colors.text },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  statusChipSuccess: { },
  statusText: { fontSize: 12, fontWeight: "600", color: colors.error },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 25 },
  addressText: { flex: 1, fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 },
  descText: { fontSize: 15, color: colors.textSecondary, lineHeight: 24, fontWeight: "500" },
  groupCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  infoRowWrapper: { width: "100%" },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 15, gap: 15 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 10, color: colors.textMuted, fontWeight: "700", textTransform: "uppercase" },
  infoValue: { fontSize: 14, fontWeight: "700", color: colors.text },
  infoRowDivider: { height: 1, backgroundColor: colors.border, marginLeft: 65 },
  videoScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  videoCard: { width: 140, height: 200, borderRadius: 15, overflow: "hidden", marginRight: 15, backgroundColor: "#000" },
  video: { width: "100%", height: "100%" },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: colors.text },
  actionBtnTextPrimary: { },
  fab: { position: "absolute", bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50 },
  sheetTitle: { fontSize: 18, fontWeight: "900", marginBottom: 25, textAlign: "center", color: colors.text },
  sheetOptions: { flexDirection: "row", gap: 20 },
  sheetBtn: { flex: 1, alignItems: "center", gap: 10 },
  sheetIcon: { width: 60, height: 60, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  sheetText: { fontSize: 13, fontWeight: "700", color: colors.text },
  viewerContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 60, right: 20, zIndex: 10 },
  viewerSlide: { width: W, height: H, justifyContent: "center" },
  viewerImage: { width: W, height: H * 0.8 },
});
