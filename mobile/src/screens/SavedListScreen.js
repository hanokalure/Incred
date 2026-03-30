import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScreenHeader from "../components/ScreenHeader";
import PlaceCard from "../components/PlaceCard";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchSavedPlaceCards } from "../services/savedApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";

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
      <ScreenHeader title="Saved Collections" onBack={() => navigation.goBack()} />
      {savedPlaces.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>You haven't saved any places yet. Start exploring to build your collection!</Text>
        </View>
      ) : (
        savedPlaces.map((p) => (
          <PlaceCard
            key={p.id}
            name={p.name}
            category={p.category}
            distance={p.distance}
            rating={p.avg_rating ?? p.rating}
            imageUrl={toDisplayImageUrl(p.image_urls?.[0])}
            videoUrl={toDisplayMediaUrl(p.video_urls?.[0])}
            onPress={() => navigation.navigate("PlaceDetail", { id: p.id })}
          />
        ))
      )}
    </PageCard>
  );
}

const styles = StyleSheet.create({
  empty: {
    marginTop: spacing.xl,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
