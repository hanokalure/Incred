import { useCallback, useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenHeader from "../components/ScreenHeader";
import PlaceCard from "../components/PlaceCard";
import PageCard from "../components/PageCard";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchSavedPlaceCards } from "../services/savedApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { getPlaceCategoryLabel } from "../constants/placeCategories";
import { useLanguage } from "../context/LanguageContext";

export default function SavedListScreen({ navigation }) {
  const { t } = useLanguage();
  const [savedPlaces, setSavedPlaces] = useState([]);
  const categoryLabel = (value) => {
    const mapping = {
      restaurant: t("categoryRestaurant"),
      generational_shop: t("categoryGenerationalShop"),
      tourist_place: t("categoryTouristPlace"),
      hidden_gem: t("categoryHiddenGem"),
      stay: t("categoryStay"),
    };
    return mapping[value] || getPlaceCategoryLabel(value);
  };

  const load = useCallback(async () => {
      try {
        const places = await fetchSavedPlaceCards();
        setSavedPlaces(places || []);
      } catch (e) {
        setSavedPlaces([]);
      }
    }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <PageCard>
      <ScreenHeader title={t("savedPlacesTitle")} onBack={() => navigation.goBack()} />
      {savedPlaces.length === 0 ? (
        <Text style={styles.text}>{t("noSavedPlaces")}</Text>
      ) : (
        savedPlaces.map((p) => (
          <PlaceCard
            key={p.id}
            name={p.name}
            category={categoryLabel(p.category)}
            rating={p.avg_rating ?? p.rating}
            imageUrl={toDisplayImageUrl(p.image_urls?.[0])}
            videoUrl={toDisplayMediaUrl(p.video_urls?.[0])}
            hideDistance
            onPress={() => navigation.navigate("PlaceDetail", { id: p.id, sourceSection: "Saved" })}
          />
        ))
      )}
    </PageCard>
  );
}

const styles = StyleSheet.create({
  text: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
