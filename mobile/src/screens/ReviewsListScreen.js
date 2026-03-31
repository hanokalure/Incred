import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchReviews } from "../services/reviewsApi";
import { toDisplayImageUrl } from "../services/mediaUrl";

export default function ReviewsListScreen({ navigation, route }) {
  const placeParam = route?.params?.id;
  const placeId = Number.isFinite(Number(placeParam)) ? Number(placeParam) : null;
  const localReviews = useSelector((state) => state.reviews.reviewsByPlace[placeParam] || []);
  const [remoteReviews, setRemoteReviews] = useState([]);

  useEffect(() => {
    if (!placeId) return;
    fetchReviews(placeId)
      .then((data) => setRemoteReviews(data || []))
      .catch(() => {});
  }, [placeId]);

  const reviews = remoteReviews.length > 0 ? remoteReviews : localReviews;

  return (
    <PageCard>
      <ScreenHeader title="Reviews" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {reviews.length === 0 ? (
          <Text style={styles.text}>No reviews yet.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.name}>{r.user_name || r.user || "Guest"}</Text>
              <Text style={styles.meta}>Rating: {r.rating}</Text>
              <Text style={styles.body}>{r.text || r.comment || "(no text)"}</Text>
              {r.image_url ? (
                <Image source={{ uri: toDisplayImageUrl(r.image_url) }} style={styles.image} resizeMode="cover" />
              ) : null}
              {r.sentiment_label ? <Text style={styles.sentiment}>Sentiment: {r.sentiment_label}</Text> : null}
            </View>
          ))
        )}
        <PrimaryButton label="Write a Review" onPress={() => navigation.navigate("ReviewSubmit", { id: placeId || placeParam })} />
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
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  sentiment: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.success,
  },
  text: {
    ...typography.body,
    marginBottom: spacing.md,
  },
});
