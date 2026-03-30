import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import CategoryChip from "../components/CategoryChip";
import PlaceCard from "../components/PlaceCard";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaces } from "../services/placesApi";
import { fetchDistricts } from "../services/districtsApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";

export default function SearchFilterScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [status, setStatus] = useState("idle");

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

  const districtOptions = useMemo(
    () => [{ id: null, name: "All Districts" }, ...(districts || [])],
    [districts]
  );

  useEffect(() => {
    fetchDistricts()
      .then((data) => setDistricts(data || []))
      .catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    setStatus("loading");
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (selectedDistrict) params.district_id = selectedDistrict;
    fetchPlaces(params)
      .then((data) => setPlaces(data || []))
      .catch(() => setPlaces([]))
      .finally(() => setStatus("idle"));
  }, [selectedCategory, selectedDistrict]);

  return (
    <PageCard>
      <ScreenHeader title="Discover" onBack={() => navigation.goBack()} />
      <Text style={styles.helper}>Find the best local spots and hidden gems across Karnataka.</Text>

      <View style={styles.row}>
        {CATEGORY_OPTIONS.map((c) => (
          <CategoryChip
            key={c.label}
            label={c.label}
            selected={selectedCategory === c.value || (c.value === null && selectedCategory === null)}
            onPress={() => setSelectedCategory(c.value)}
          />
        ))}
      </View>

      <View style={styles.row}>
        {districtOptions.map((d) => (
          <CategoryChip
            key={d.id ?? "all"}
            label={d.name}
            selected={selectedDistrict === d.id || (d.id === null && selectedDistrict === null)}
            onPress={() => setSelectedDistrict(d.id)}
          />
        ))}
      </View>

      {places.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No places found in this category.</Text>
        </View>
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
  helper: {
    ...typography.body,
    marginBottom: spacing.lg,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  empty: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
