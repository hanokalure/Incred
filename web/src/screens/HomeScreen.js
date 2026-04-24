import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions, FlatList } from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaces } from "../services/placesApi";
import { toDisplayImageUrl } from "../services/mediaUrl";
import { fetchAdminDashboard } from "../services/adminApi";
import StoryStrip from "../components/StoryStrip";
import { useLanguage } from "../context/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function FeatureCard({ item, onPress }) {
  return (
    <Pressable style={styles.featureCard} onPress={onPress}>
      <Image source={{ uri: toDisplayImageUrl(item.image_urls?.[0]) }} style={styles.featureImage} />
      <View style={styles.featureOverlay}>
        <View style={styles.featureBadge}><Text style={styles.featureBadgeText}>FEATURED</Text></View>
        <Text style={styles.featureTitle} numberOfLines={1}>{String(item.name)}</Text>
        <View style={styles.featureMeta}>
          <Ionicons name="location-outline" size={14} color="#fff" />
          <Text style={styles.featureLoc}>Karnataka Hub</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ActionTile({ icon, title, color, onPress }) {
  return (
    <Pressable style={styles.actionTile} onPress={onPress}>
      <View style={[styles.actionIconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.actionTitle}>{String(title)}</Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation, route }) {
  const { role, user } = useSelector(state => state.auth);
  const { t } = useLanguage();
  const [places, setPlaces] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    fetchPlaces().then(data => setPlaces(data || [])).catch(() => setPlaces([]));
    if (role === "admin") {
      fetchAdminDashboard().then(setAdminStats).catch(() => {});
    }
  }, [role]);

  const featured = useMemo(() => places.slice(0, 5), [places]);
  const recommended = useMemo(() => places.slice(5, 11), [places]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. WEB HEADER */}
        <View style={styles.webHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t("greeting")},</Text>
            <Text style={styles.userName}>{String(user?.name || t("explorer"))} 👋</Text>
          </View>
          {role === "admin" && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={styles.adminBadgeText}>ADMIN ACCESS</Text>
            </View>
          )}
        </View>

        {/* 2. STORIES */}
        <StoryStrip navigation={navigation} refreshKey={route?.params?.storyRefreshAt || 0} />

        {/* 3. HERO CAROUSEL */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXPERIENCE KARNATAKA</Text>
          <FlatList
            data={featured}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH > 800 ? 520 : SCREEN_WIDTH - 60}
            decelerationRate="fast"
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <FeatureCard item={item} onPress={() => navigation.navigate("PlaceDetail", { id: item.id })} />
            )}
            contentContainerStyle={{ gap: 20 }}
          />
        </View>

        {/* 4. ADMIN DASHBOARD - Grouped Style */}
        {role === "admin" && adminStats && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SYSTEM OVERVIEW</Text>
            <View style={styles.statsGrid}>
              <Pressable style={styles.statBox} onPress={() => navigation.navigate("Listings")}>
                <Text style={styles.statVal}>{String(adminStats.stats?.total_places || 0)}</Text>
                <Text style={styles.statLab}>Places</Text>
              </Pressable>
              <Pressable style={styles.statBox} onPress={() => navigation.navigate("Users")}>
                <Text style={styles.statVal}>{String(adminStats.stats?.total_users || 0)}</Text>
                <Text style={styles.statLab}>Users</Text>
              </Pressable>
              <Pressable style={styles.statBox} onPress={() => navigation.navigate("Analytics")}>
                <Text style={styles.statVal}>{String(adminStats.stats?.total_reviews || 0)}</Text>
                <Text style={styles.statLab}>Reviews</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 5. QUICK TILES */}
        <View style={styles.actionGrid}>
          <ActionTile icon="map-outline" title="Map Hub" color="#3498DB" onPress={() => navigation.navigate("Map")} />
          <ActionTile icon="sparkles-outline" title="AI Planner" color="#9B59B6" onPress={() => navigation.navigate("Itinerary")} />
          <ActionTile icon="navigate-outline" title="Near Me" color="#27AE60" onPress={() => navigation.navigate("Discover")} />
          <ActionTile icon="bookmark-outline" title="Saved" color="#E67E22" onPress={() => navigation.navigate("Saved")} />
        </View>

        {/* 6. RECOMMENDED HUB */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RECOMMENDED DISCOVERIES</Text>
            <Pressable onPress={() => navigation.navigate("Discover")}>
              <Text style={styles.seeAll}>Browse All</Text>
            </Pressable>
          </View>
          <View style={styles.groupedContainer}>
            {recommended.map((p, index) => (
              <Pressable 
                key={p.id} 
                style={styles.groupedItem} 
                onPress={() => navigation.navigate("PlaceDetail", { id: p.id })}
              >
                <Image source={{ uri: toDisplayImageUrl(p.image_urls?.[0]) }} style={styles.groupedMedia} />
                <View style={styles.groupedInfo}>
                  <Text style={styles.groupedTitle} numberOfLines={1}>{String(p.name)}</Text>
                  <Text style={styles.groupedMeta}>{String(p.category || "Place").toUpperCase()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                {index < recommended.length - 1 && <View style={styles.divider} />}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, maxWidth: 1200, alignSelf: "center", width: "100%" },

  webHeader: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  greeting: { fontSize: 18, color: colors.textSecondary, fontWeight: "600" },
  userName: { fontSize: 32, color: colors.text, fontWeight: "900", marginTop: 4 },
  adminBadge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 6 },
  adminBadgeText: { fontSize: 10, fontWeight: "900", color: colors.primary, letterSpacing: 1 },

  section: { marginBottom: 40 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "900", color: colors.textMuted, letterSpacing: 1.5, marginBottom: 16 },
  seeAll: { fontSize: 14, fontWeight: "700", color: colors.primary },

  featureCard: { width: 500, height: 280, borderRadius: 24, overflow: "hidden" },
  featureImage: { width: "100%", height: "100%" },
  featureOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', padding: 30, justifyContent: "flex-end" },
  featureBadge: { backgroundColor: colors.primary, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  featureBadgeText: { fontSize: 10, fontWeight: "900", color: "#1A1A1A" },
  featureTitle: { fontSize: 28, fontWeight: "900", color: "#fff" },
  featureMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  featureLoc: { fontSize: 14, color: "#fff", opacity: 0.8, fontWeight: "600" },

  statsGrid: { flexDirection: "row", gap: 20 },
  statBox: { flex: 1, backgroundColor: colors.surface, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  statVal: { fontSize: 32, fontWeight: "900", color: colors.text },
  statLab: { fontSize: 12, color: colors.textMuted, fontWeight: "700", textTransform: "uppercase", marginTop: 4 },

  actionGrid: { flexDirection: "row", gap: 20, marginBottom: 40 },
  actionTile: { flex: 1, height: 120, backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  actionIconWrap: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  actionTitle: { fontSize: 16, fontWeight: "800", color: colors.text },

  groupedContainer: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  groupedItem: { flexDirection: "row", alignItems: "center", padding: 20 },
  groupedMedia: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.accent },
  groupedInfo: { flex: 1, marginLeft: 20 },
  groupedTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  groupedMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: "600" },
  divider: { position: "absolute", bottom: 0, left: 96, right: 0, height: 1, backgroundColor: colors.border },
});
