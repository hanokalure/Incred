import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import CategoryChip from "../components/CategoryChip";
import PlaceCard from "../components/PlaceCard";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaces } from "../services/placesApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";

export default function NearbyScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState(null);

  const CATEGORY_OPTIONS = [
    { label: "All", value: null },
    { label: "Food", value: "restaurant" },
    { label: "Stay", value: "stay" },
    { label: "Shops", value: "generational_shop" },
    { label: "Hidden Gems", value: "hidden_gem" },
    { label: "Tourist", value: "tourist_place" },
  ];

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

  useEffect(() => {
    const params = {};
    if (selected) params.category = selected;
    fetchPlaces(params)
      .then((data) => setPlaces(data || []))
      .catch(() => setPlaces([]));
  }, [selected]);

  return (
    <PageCard>
      <ScreenHeader title="Nearby Discoveries" onBack={() => navigation.goBack()} />

      <View style={styles.row}>
        {CATEGORY_OPTIONS.map((c) => (
          <CategoryChip
            key={c.label}
            label={c.label}
            selected={selected === c.value || (c.value === null && selected === null)}
            onPress={() => setSelected(c.value)}
          />
        ))}
      </View>

      {places.length === 0 ? (
        <Text style={styles.text}>No places found in this category.</Text>
      ) : (
        places.map((p) => (
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
        ))
      )}
    </PageCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
