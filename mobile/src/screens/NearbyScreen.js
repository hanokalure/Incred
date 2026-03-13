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

export default function NearbyScreen({ navigation }) {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.places.categories);
  const selected = useSelector((state) => state.places.selectedCategory);
  const places = useSelector((state) => state.places.places);

  const filtered = selected === "All" ? places : places.filter((p) => p.category === selected);

  return (
    <PageCard>
      <ScreenHeader title="Nearby Discoveries" onBack={() => navigation.goBack()} />

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
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  text: {
    ...typography.body,
  },
});
