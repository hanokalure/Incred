import { View, Text, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import PlaceCard from "../components/PlaceCard";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function SavedListScreen({ navigation }) {
  const savedIds = useSelector((state) => state.saved.saved);
  const places = useSelector((state) => state.places.places);
  const savedPlaces = places.filter((p) => savedIds.includes(p.id));

  return (
    <PageCard>
      <ScreenHeader title="Saved Collections" onBack={() => navigation.goBack()} />
      {savedPlaces.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>You haven't saved any places yet. Start exploring to build your collection!</Text>
        </View>
      ) : (
        savedPlaces.map((p) => (
          <PlaceCard key={p.id} name={p.name} category={p.category} distance={p.distance} rating={p.rating} />
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
