import { View, Text, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import CategoryChip from "../components/CategoryChip";
import PlaceCard from "../components/PlaceCard";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { setCategory, clearCategory } from "../store/slices/placesSlice";

export default function SearchFilterScreen({ navigation }) {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.places.categories);
  const selected = useSelector((state) => state.places.selectedCategory);
  const places = useSelector((state) => state.places.places);

  const filtered = selected === "All" ? places : places.filter((p) => p.category === selected);

  return (
    <PageCard>
      <ScreenHeader title="Discover" onBack={() => navigation.goBack()} />
      <Text style={styles.helper}>Find the best local spots and hidden gems across Karnataka.</Text>

      <View style={styles.row}>
        <CategoryChip
          label="All"
          selected={selected === "All"}
          onPress={() => dispatch(clearCategory())}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c}
            label={c}
            selected={selected === c}
            onPress={() => dispatch(setCategory(c))}
          />
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No places found in this category.</Text>
        </View>
      ) : (
        filtered.map((p) => (
          <PlaceCard key={p.id} name={p.name} category={p.category} distance={p.distance} rating={p.rating} />
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
