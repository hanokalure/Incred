import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { useDispatch, useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import PageCard from "../components/PageCard";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { toggleSaved } from "../store/slices/savedSlice";

export default function PlaceDetailScreen({ navigation, route }) {
  const placeId = route?.params?.id || "p3";
  const dispatch = useDispatch();
  const isSaved = useSelector((state) => state.saved.saved.includes(placeId));

  return (
    <PageCard>
      <ScreenHeader title="Place Detail" onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Mysuru Silk House</Text>
      <Text style={styles.meta}>Category: Shops • Rating: 4.5</Text>
      <Text style={styles.desc}>
        Family-run silk store with heritage craftsmanship and curated textiles.
      </Text>

      <Text style={styles.section}>Photos</Text>
      <PhotoPlaceholder label="Place photos (coming soon)" />

      <View style={styles.buttonContainer}>
        <PrimaryButton label={isSaved ? "Remove from Saved" : "Save Place"} onPress={() => dispatch(toggleSaved(placeId))} />
        <PrimaryButton label="Add to Itinerary" onPress={() => navigation.navigate("DayPlan")} variant="ghost" />
        <PrimaryButton label="Get Directions" onPress={() => navigation.navigate("Map")} variant="ghost" />
        <PrimaryButton label="Read Reviews" onPress={() => navigation.navigate("ReviewsList", { id: placeId })} variant="ghost" />
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  desc: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  section: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  buttonContainer: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
