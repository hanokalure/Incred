import { View, Text, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function ReviewsListScreen({ navigation, route }) {
  const placeId = route?.params?.id || "p3";
  const reviews = useSelector((state) => state.reviews.reviewsByPlace[placeId] || []);

  return (
    <PageCard>
      <ScreenHeader title="Reviews" onBack={() => navigation.goBack()} />
      {reviews.length === 0 ? (
        <Text style={styles.text}>No reviews yet.</Text>
      ) : (
        reviews.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.name}>{r.user}</Text>
            <Text style={styles.meta}>Rating: {r.rating}</Text>
            <Text style={styles.body}>{r.text}</Text>
            {r.sentiment_label ? <Text style={styles.sentiment}>Sentiment: {r.sentiment_label}</Text> : null}
          </View>
        ))
      )}
      <PrimaryButton label="Write a Review" onPress={() => navigation.navigate("ReviewSubmit", { id: placeId })} />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 20,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  meta: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  sentiment: {
    ...typography.body,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.sm,
    color: colors.success,
  },
  text: {
    ...typography.body,
    textAlign: "center",
    color: colors.textSecondary,
    marginVertical: spacing.xl,
  },
});
