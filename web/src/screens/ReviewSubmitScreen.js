import { useEffect, useState } from "react";
import { Text, TextInput, StyleSheet, View } from "react-native";
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
import { submitReview } from "../services/reviewsApi";
import { uploadReviewImage } from "../services/uploadsApi";
import { toDisplayImageUrl } from "../services/mediaUrl";

export default function ReviewSubmitScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const placeParam = route?.params?.id;
  const placeId = Number.isFinite(Number(placeParam)) ? Number(placeParam) : null;
  const [rating, setRating] = useState("5");
  const [text, setText] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [status, setStatus] = useState("idle");
  const [sentimentLabel, setSentimentLabel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const onFileChange = async (e) => {
    const selected = e?.target?.files?.[0] || null;
    if (!selected) return;

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(selected));
    setUploadStatus("uploading");
    setError("");
    try {
      const res = await uploadReviewImage(selected);
      setImageUrl(res.public_url || "");
    } catch (uploadErr) {
      setError(uploadErr.message || "Image upload failed");
      setImageUrl("");
    } finally {
      setUploadStatus("idle");
    }
  };

  const onSubmit = async () => {
    setStatus("loading");
    setError("");
    let sentiment = { sentiment_score: 0, label: "Unknown" };
    try {
      sentiment = await analyzeSentiment(text || "");
      setSentimentLabel(sentiment.label);
    } catch (e) {
      setSentimentLabel("");
    }

    if (placeId) {
      try {
        await submitReview({
          place_id: placeId,
          rating: Number(rating) || 0,
          comment: text || "",
          image_url: imageUrl || null,
        });
      } catch (e) {
        // fallback to local only
      }
    }

    dispatch(
      addReview({
        placeId: placeId || placeParam || "local",
        review: {
          id: `r${Date.now()}`,
          user: "You",
          rating: Number(rating) || 0,
          text: text || "(no text)",
          image_url: imageUrl || null,
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
      <Text style={styles.label}>Rating (1-5)</Text>
      <TextInput value={rating} onChangeText={setRating} keyboardType="numeric" style={styles.input} />
      <Text style={styles.label}>Your review</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        style={[styles.input, styles.textArea]}
        multiline
        placeholder="Share your experience"
        placeholderTextColor={colors.charcoal}
      />
      <Text style={styles.label}>Upload photos</Text>
      {imagePreviewUrl ? (
        <View style={styles.previewWrap}>
          <img src={imagePreviewUrl} alt="Selected review" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </View>
      ) : imageUrl ? (
        <View style={styles.previewWrap}>
          <img src={toDisplayImageUrl(imageUrl)} alt="Uploaded review" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </View>
      ) : (
        <PhotoPlaceholder label="Add a photo" />
      )}
      <View style={styles.fileRow}>
        <input type="file" accept="image/*" onChange={onFileChange} />
      </View>
      {uploadStatus === "uploading" ? <Text style={styles.hint}>Uploading photo...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {sentimentLabel && sentimentLabel !== "Unknown" ? <Text style={styles.hint}>Sentiment: {sentimentLabel}</Text> : null}
      <PrimaryButton label={status === "loading" ? "Analyzing..." : "Submit Review"} onPress={onSubmit} />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  hint: {
    ...typography.body,
    fontSize: 14,
    color: colors.success,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  fileRow: {
    marginBottom: spacing.lg,
  },
  previewWrap: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  error: {
    ...typography.body,
    fontSize: 14,
    color: colors.error,
    marginBottom: spacing.md,
  },
});
