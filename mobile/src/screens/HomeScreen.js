import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar, Pressable, Image } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import CategoryChip from "../components/CategoryChip";
import SectionHeader from "../components/SectionHeader";
import PlaceCard from "../components/PlaceCard";
import PrimaryButton from "../components/PrimaryButton";
import { loadRecommendations } from "../store/slices/recommendationsSlice";
import { fetchPlaceCategories, fetchPlaces } from "../services/placesApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { attachDistanceToPlaces, requestCurrentLocation } from "../services/locationHelpers";
import StoryStrip from "../components/StoryStrip";
import PageCard from "../components/PageCard";

export default function HomeScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const language = useSelector((state) => state.lang.language);
  const user = useSelector((state) => state.auth.user);
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const categoryLabel = (value) => {
    const mapping = {
      restaurant: "Food",
      stay: "Stay",
      generational_shop: "Shops",
      hidden_gem: "Hidden Gems",
      tourist_place: "Tourist",
    };
    return mapping[value] || String(value).toUpperCase();
  };

  const allPlaces = useMemo(() => attachDistanceToPlaces(places, userLocation), [places, userLocation]);
  const visiblePlaces = useMemo(() => {
    if (!selectedCategory) return allPlaces;
    return allPlaces.filter((place) => place.category === selectedCategory);
  }, [allPlaces, selectedCategory]);

  const t = {
    en: {
      categories: "TOP CATEGORIES",
      curated: "SUGGESTED DISCOVERIES",
      showAll: "Show all",
    }
  }[language] || {
    categories: "TOP CATEGORIES",
    curated: "SUGGESTED DISCOVERIES",
    showAll: "Show all",
  };

  useEffect(() => {
    fetchPlaces().then(setPlaces).catch(() => setPlaces([]));
    fetchPlaceCategories().then(setCategories).catch(() => setCategories([]));
    requestCurrentLocation().then(setUserLocation).catch(() => {});
    dispatch(loadRecommendations({ user_id: "demo", lat: 12.9716, lng: 77.5946 }));
  }, [dispatch]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <PageCard hideHeader={false} style={{ backgroundColor: '#F8F9FA' }}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. SLEEK INFORMATIONAL HUB HEADER */}
      <View style={styles.dashboardHeader}>
        <View style={styles.headerTop}>
          <View style={styles.greetingCol}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{String(user?.name || "Explorer")} 👋</Text>
          </View>
          <View style={styles.statusCol}>
             <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={12} color={colors.primary} style={{marginRight: 6}} />
                <Text style={styles.dateText}>{today}</Text>
             </View>
             <View style={styles.weatherBadge}>
                <Ionicons name="sunny" size={12} color="#F1C40F" style={{marginRight: 6}} />
                <Text style={styles.weatherText}>24°C</Text>
             </View>
          </View>
        </View>
      </View>

      <StoryStrip navigation={navigation} refreshKey={route?.params?.storyRefreshAt || 0} />

      {/* 2. CATEGORIES */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{t.categories}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <CategoryChip
            key={category}
            label={categoryLabel(category)}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory((value) => (value === category ? null : category))}
          />
        ))}
      </ScrollView>

      {/* 3. SUGGESTED DISCOVERIES */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{t.curated}</Text>
        <Pressable onPress={() => navigation.navigate("Discover", { category: selectedCategory })}>
          <Text style={styles.seeAllText}>{t.showAll}</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.featuredRow}
        contentContainerStyle={styles.featuredRowContent}
      >
        {visiblePlaces.slice(0, 6).map((p) => (
          <View key={p.id} style={styles.featuredCardWrap}>
            <PlaceCard
              name={p.name}
              category={categoryLabel(p.category)}
              distance={p.distance}
              rating={p.avg_rating ?? p.rating}
              imageUrl={toDisplayImageUrl(p.image_urls?.[0])}
              videoUrl={toDisplayMediaUrl(p.video_urls?.[0])}
              onPress={() => navigation.navigate("PlaceDetail", { id: p.id })}
            />
          </View>
        ))}
      </ScrollView>

      {/* 4. AI PROMO */}
      <View style={styles.promoCard}>
        <View style={styles.promoContent}>
          <View style={styles.promoHeader}>
            <Text style={styles.promoTitle}>AI ITINERARY</Text>
            <Ionicons name="sparkles" size={18} color="#1A1A1A" />
          </View>
          <Text style={styles.promoText}>Let AI plan your perfect weekend getaway based on your interests.</Text>
          <PrimaryButton
            label="Generate My Plan"
            onPress={() => navigation.navigate("Itinerary")}
            style={styles.promoBtn}
          />
        </View>
      </View>

      <PrimaryButton
        label="Browse All Places"
        onPress={() => navigation.navigate("Discover", { category: selectedCategory })}
        variant="ghost"
      />
      <View style={{ height: 60 }} />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  dashboardHeader: { marginBottom: 30, marginTop: 15 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greetingCol: { flex: 1 },
  greetingText: { fontSize: 16, color: colors.textSecondary, fontWeight: "600", marginBottom: 4 },
  userName: { fontSize: 34, color: colors.text, fontWeight: "900", letterSpacing: -1 },
  
  statusCol: { alignItems: "flex-end", gap: 8 },
  dateBadge: { flexDirection: "row", alignItems: "center", backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E9ECEF', elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  weatherBadge: { flexDirection: "row", alignItems: "center", backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E9ECEF', elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  dateText: { fontSize: 11, fontWeight: "800", color: colors.textSecondary, letterSpacing: 0.5 },
  weatherText: { fontSize: 11, fontWeight: "800", color: colors.textSecondary },
  
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, marginTop: 10 },
  sectionLabel: { fontSize: 11, fontWeight: "900", color: colors.textMuted, letterSpacing: 1.5 },
  seeAllText: { fontSize: 13, fontWeight: "700", color: colors.primary },

  categoryRow: { marginHorizontal: -20, marginBottom: 15 },
  categoryContent: { paddingLeft: 20, paddingRight: 40 },
  
  featuredRow: { marginHorizontal: -20, marginBottom: 5 },
  featuredRowContent: { paddingLeft: 20, paddingRight: 40 },
  featuredCardWrap: { width: 290, marginRight: 15 },

  promoCard: { backgroundColor: colors.primary, borderRadius: 28, padding: 24, marginVertical: 30, elevation: 8, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 15 },
  promoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  promoTitle: { fontSize: 13, fontWeight: "900", color: "#1A1A1A", letterSpacing: 1 },
  promoText: { fontSize: 15, marginTop: 5, marginBottom: 20, color: "#1A1A1A", opacity: 0.85, fontWeight: "600", lineHeight: 22 },
  promoBtn: { backgroundColor: "#fff", paddingVertical: 12, borderRadius: 16 },
});
