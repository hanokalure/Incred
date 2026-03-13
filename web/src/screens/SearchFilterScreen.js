import { View, Text, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import CategoryChip from "../components/CategoryChip";
import PlaceCard from "../components/PlaceCard";
import PageCard from "../components/PageCard";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { colors } from "../theme/colors";
import { setCategory, clearCategory } from "../store/slices/placesSlice";

export default function SearchFilterScreen({ navigation }) {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.places.categories);
  const selected = useSelector((state) => state.places.selectedCategory);
  const places = useSelector((state) => state.places.places);

  const filtered = selected === "All" ? places : places.filter((p) => p.category === selected);

  return (
    <PageCard>
      <ScreenHeader title="Search & Filter" onBack={() => navigation.goBack()} />
      <Text style={styles.helper}>Select a category to filter listings.</Text>

      <View style={styles.row}>
        <CategoryChip label="All" selected={selected === "All"} onPress={() => dispatch(clearCategory())} />
        {categories.map((c) => (
          <CategoryChip key={c} label={c} selected={selected === c} onPress={() => dispatch(setCategory(c))} />
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.text}>No places found in this category.</Text>
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
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
