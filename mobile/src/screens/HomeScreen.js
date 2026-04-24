import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar } from "react-native";
import { useDispatch, useSelector } from "react-redux";
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
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const categoryLabel = (value) => {
    const mapping = {
      restaurant: "Food",
      stay: "Stay",
      generational_shop: "Shops",
      hidden_gem: "Hidden Gems",
      tourist_place: "Tourist",
    };
    return mapping[value] || value;
  };

  const allPlaces = useMemo(() => attachDistanceToPlaces(places, userLocation), [places, userLocation]);
  const visiblePlaces = useMemo(() => {
    if (!selectedCategory) return allPlaces;
    return allPlaces.filter((place) => place.category === selectedCategory);
  }, [allPlaces, selectedCategory]);
  const recommendedIds = useSelector((state) => state.recommendations.recommended);
  const recommended = visiblePlaces.filter((p) => recommendedIds.includes(String(p.id)));
  const suggestedPlaces = (recommended.length ? recommended : visiblePlaces).slice(0, 6);
  const recentPlaces = visiblePlaces.slice(0, 3);

  const t = {
    en: {
      greeting: "Namaste,",
      explorer: "Explorer",
      subtitle: "Discover the soul of Karnataka through local experiences.",
      categories: "Top Categories",
      curated: "Suggested for You",
      showAll: "Show all",
    },
    kn: {
      greeting: "ನಮಸ್ಕಾರ,",
      explorer: "ಅನ್ವೇಷಕ",
      subtitle: "ಸ್ಥಳೀಯ ಅನುಭವಗಳ ಮೂಲಕ ಕರ್ನಾಟಕದ ಆತ್ಮವನ್ನು ಅನ್ವೇಷಿಸಿ.",
      categories: "ಪ್ರಮುಖ ವರ್ಗಗಳು",
      curated: "ನಿಮಗಾಗಿ ಆಯ್ದವುಗಳು",
      showAll: "ಎಲ್ಲವನ್ನೂ ತೋರಿಸಿ",
    },
    hi: {
      greeting: "नमस्ते,",
      explorer: "अन्वेषक",
      subtitle: "स्थानीय अनुभवों के माध्यम से कर्नाटक की आत्मा की खोज करें।",
      categories: "शीर्ष श्रेणियां",
      curated: "आपके लिए सुझाए गए",
      showAll: "सभी दिखाएं",
    },
  }[language];

  useEffect(() => {
    dispatch(
      loadRecommendations({
        user_id: "demo",
        lat: 12.9716,
        lng: 77.5946,
        saved_place_ids: [],
        ratings: [],
        categories: [],
      })
    );
  }, [dispatch]);

  useEffect(() => {
    fetchPlaces()
      .then((data) => setPlaces(data || []))
      .catch(() => setPlaces([]));
  }, []);

  useEffect(() => {
    fetchPlaceCategories()
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    requestCurrentLocation().then(setUserLocation);
  }, []);

  return (
    <PageCard hideHeader={false}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>{t.greeting}{'\n'}{t.explorer}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      <StoryStrip navigation={navigation} refreshKey={route?.params?.storyRefreshAt || 0} />

      <SectionHeader title={t.categories} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}
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

      <SectionHeader
        title={t.curated}
        action={t.showAll}
        onActionPress={() => navigation.navigate("Discover", { category: selectedCategory })}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.featuredRow}
        contentContainerStyle={styles.featuredRowContent}
      >
        {suggestedPlaces.map((p) => (
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

      <View style={styles.promoCard}>
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>AI Itinerary</Text>
          <Text style={styles.promoText}>Let AI plan your perfect weekend getaway based on your interests.</Text>
          <PrimaryButton
            label="Generate My Plan"
            onPress={() => navigation.navigate("Itinerary")}
            style={styles.promoBtn}
          />
        </View>
      </View>

      <SectionHeader title="Recently Added" />
      {recentPlaces.map((p) => (
        <PlaceCard
          key={p.id}
          name={p.name}
          category={categoryLabel(p.category)}
          distance={p.distance}
          rating={p.avg_rating ?? p.rating}
          imageUrl={toDisplayImageUrl(p.image_urls?.[0])}
          videoUrl={toDisplayMediaUrl(p.video_urls?.[0])}
          onPress={() => navigation.navigate("PlaceDetail", { id: p.id })}
        />
      ))}

      <PrimaryButton
        label="Browse All Places"
        onPress={() => navigation.navigate("Discover", { category: selectedCategory })}
        variant="ghost"
      />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.textSecondary,
    maxWidth: "90%",
  },
  row: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.xs,
  },
  rowContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.xl,
  },
  featuredRow: {
    marginHorizontal: -spacing.lg,
  },
  featuredRowContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.xl,
  },
  featuredCardWrap: {
    width: 260,
    marginRight: spacing.sm,
  },
  promoCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    overflow: "hidden",
  },
  promoTitle: {
    ...typography.h2,
    color: colors.text,
  },
  promoText: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    color: colors.text,
    opacity: 0.9,
  },
  promoBtn: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  footerSpacer: {
    height: 40,
  },
});
