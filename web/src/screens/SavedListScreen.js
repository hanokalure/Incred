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

export default function SavedListScreen({ navigation }) {
  const [savedPlaces, setSavedPlaces] = useState([]);

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
      <ScreenHeader title="Saved Places" onBack={() => navigation.goBack()} />
      {savedPlaces.length === 0 ? (
        <Text style={styles.text}>No saved places yet.</Text>
      ) : (
        savedPlaces.map((p) => (
          <PlaceCard
            key={p.id}
            name={p.name}
            category={getPlaceCategoryLabel(p.category)}
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
