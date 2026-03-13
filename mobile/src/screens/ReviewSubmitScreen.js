import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useDispatch } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { addReview } from "../store/slices/reviewsSlice";
import { analyzeSentiment } from "../services/sentimentApi";

export default function ReviewSubmitScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const placeId = route?.params?.id || "p3";
  const [rating, setRating] = useState("5");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle");
  const [sentimentLabel, setSentimentLabel] = useState("");

  const onSubmit = async () => {
    setStatus("loading");
    let sentiment = { sentiment_score: 0, label: "Unknown" };
    try {
      sentiment = await analyzeSentiment(text || "");
      setSentimentLabel(sentiment.label);
    } catch (e) {
      setSentimentLabel("Unknown");
    }

    dispatch(
      addReview({
        placeId,
        review: {
          id: `r${Date.now()}`,
          user: "You",
          rating: Number(rating) || 0,
          text: text || "(no text)",
          sentiment_label: sentiment.label,
          sentiment_score: sentiment.sentiment_score,
        },
      })
    );
    setStatus("succeeded");
    navigation.goBack();
  };

  return (
    <PageCard>
      <ScreenHeader title="Write a Review" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.label}>Rating (1-5)</Text>
        <TextInput
          value={rating}
          onChangeText={setRating}
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.label}>Your review</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          style={[styles.input, styles.textArea]}
          multiline
        />
        <Text style={styles.label}>Upload photos</Text>
        <PhotoPlaceholder label="Add photos (coming soon)" />
        {sentimentLabel ? <Text style={styles.hint}>Sentiment: {sentimentLabel}</Text> : null}
        <PrimaryButton label={status === "loading" ? "Analyzing..." : "Submit Review"} onPress={onSubmit} />
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: spacing.md,
  },
  label: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.clay,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  hint: {
    ...typography.body,
    marginBottom: spacing.md,
  },
});
