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
      <View style={styles.content}>
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
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.subheading,
  },
  meta: {
    ...typography.body,
  },
  body: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  sentiment: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.leaf,
  },
  text: {
    ...typography.body,
    marginBottom: spacing.md,
  },
});
