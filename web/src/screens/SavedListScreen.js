import { Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import PlaceCard from "../components/PlaceCard";
import PageCard from "../components/PageCard";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function SavedListScreen({ navigation }) {
  const savedIds = useSelector((state) => state.saved.saved);
  const places = useSelector((state) => state.places.places);
  const savedPlaces = places.filter((p) => savedIds.includes(p.id));

  return (
    <PageCard>
      <ScreenHeader title="Saved Places" onBack={() => navigation.goBack()} />
      {savedPlaces.length === 0 ? (
        <Text style={styles.text}>No saved places yet.</Text>
      ) : (
        savedPlaces.map((p) => (
          <PlaceCard key={p.id} name={p.name} category={p.category} distance={p.distance} rating={p.rating} />
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
