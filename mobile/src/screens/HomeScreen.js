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
import { fetchPlaces } from "../services/placesApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import StoryStrip from "../components/StoryStrip";

import PageCard from "../components/PageCard";

export default function HomeScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const language = useSelector((state) => state.lang.language);
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState("idle");

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

  const categories = useMemo(() => {
    const unique = new Set(places.map((p) => p.category).filter(Boolean));
    return Array.from(unique).map(categoryLabel);
  }, [places]);

  const featured = places.slice(0, 6);
  const allPlaces = places;
  const recommendedIds = useSelector((state) => state.recommendations.recommended);
  const recStatus = useSelector((state) => state.recommendations.status);
  const recommended = allPlaces.filter((p) => recommendedIds.includes(String(p.id)));

  const t = {
    en: {
      greeting: "Namaste,",
      explorer: "Explorer",
      subtitle: "Discover the soul of Karnataka through local experiences.",
      categories: "Top Categories",
      curated: "Curated for You",
      showAll: "Show all",
    },
    kn: {
      greeting: "ನಮಸ್ಕಾರ,",
      explorer: "ಅನ್ವೇಷಕ",
      subtitle: "ಸ್ಥಳೀಯ ಅನುಭವಗಳ ಮೂಲಕ ಕರ್ನಾಟಕದ ಆತ್ಮವನ್ನು ಅನ್ವೇಷಿಸಿ.",
      categories: "ಪ್ರಮುಖ ವರ್ಗಗಳು",
      curated: "ನಿಮಗಾಗಿ ಆಯ್ದವುಗಳು",
      showAll: "ಎಲ್ಲವನ್ನೂ ತೋರಿಸಿ",
    }
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
    setStatus("loading");
    fetchPlaces()
      .then((data) => setPlaces(data || []))
      .catch(() => setPlaces([]))
      .finally(() => setStatus("idle"));
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {categories.map((c) => (
          <CategoryChip key={c} label={c} />
        ))}
      </ScrollView>

      <SectionHeader
        title={t.curated}
        action={t.showAll}
        onActionPress={() => navigation.navigate("Discover")}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredRow}>
        {featured.map((p) => (
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
          <Text style={styles.promoTitle}>AI Guide</Text>
          <Text style={styles.promoText}>Let AI plan your perfect weekend getaway based on your interests.</Text>
          <PrimaryButton
            label="Interactive Map"
            onPress={() => navigation.navigate("Map")}
            style={styles.promoBtn}
          />
        </View>
      </View>

      <SectionHeader title="Recently Added" />
      {featured.slice(0, 3).map((p) => (
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
        onPress={() => navigation.navigate("Discover")}
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
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  featuredRow: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
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
