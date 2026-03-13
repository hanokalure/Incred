import { View, Text, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { toggleSaved } from "../store/slices/savedSlice";

import PageCard from "../components/PageCard";

export default function PlaceDetailScreen({ navigation, route }) {
  const placeId = route?.params?.id || "p3";
  const dispatch = useDispatch();
  const isSaved = useSelector((state) => state.saved.saved.includes(placeId));

  return (
    <PageCard>
      <ScreenHeader title="Place Detail" onBack={() => navigation.goBack()} />

      <View style={styles.hero}>
        <PhotoPlaceholder label="Heritage Crafts & Silk" />
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>Mysuru Silk House</Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>Shops</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.rating}>★ 4.5</Text>
        </View>
        <Text style={styles.desc}>
          Family-run silk store with heritage craftsmanship and curated textiles. Experience the rich tapestry of Karnataka's weaving traditions.
        </Text>
      </View>

      <PrimaryButton
        label={isSaved ? "Remove from Saved" : "Save to Collection"}
        onPress={() => dispatch(toggleSaved(placeId))}
      />
      <View style={styles.spacer} />
      <PrimaryButton label="Get Directions" onPress={() => navigation.navigate("Map")} variant="ghost" />
      <View style={styles.spacer} />
      <PrimaryButton label="Read Guest Reviews" onPress={() => navigation.navigate("ReviewsList", { id: placeId })} variant="ghost" />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 250,
    marginVertical: spacing.lg,
    borderRadius: 24,
    overflow: "hidden",
  },
  info: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  category: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0,
  },
  dot: {
    marginHorizontal: spacing.sm,
    color: colors.textMuted,
  },
  rating: {
    ...typography.h3,
    color: colors.primary,
  },
  desc: {
    ...typography.body,
    lineHeight: 24,
  },
  spacer: {
    height: spacing.md,
  },
});
