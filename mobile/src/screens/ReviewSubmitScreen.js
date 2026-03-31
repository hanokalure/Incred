import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
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
  const [imageAsset, setImageAsset] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [status, setStatus] = useState("idle");
  const [sentimentLabel, setSentimentLabel] = useState("");
  const [error, setError] = useState("");

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Photo permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setImageAsset(asset);
    setUploadStatus("uploading");
    setError("");
    try {
      const res = await uploadReviewImage(asset);
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
        // keep local fallback if API fails
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
        {imageAsset?.uri || imageUrl ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageAsset?.uri || toDisplayImageUrl(imageUrl) }} style={styles.previewImage} resizeMode="cover" />
          </View>
        ) : (
          <PhotoPlaceholder label="Add a photo" />
        )}
        <PrimaryButton label={imageAsset ? "Select Another Photo" : "Select Photo"} onPress={pickImage} variant="ghost" />
        {uploadStatus === "uploading" ? <Text style={styles.hint}>Uploading photo...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sentimentLabel && sentimentLabel !== "Unknown" ? <Text style={styles.hint}>Sentiment: {sentimentLabel}</Text> : null}
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
  previewWrap: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.md,
  },
});
