import { useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import PageCard from "../components/PageCard";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { createStory, uploadStoryImage, uploadStoryVideo } from "../services/storiesApi";
import { toDisplayMediaUrl } from "../services/mediaUrl";

export default function CreateStoryScreen({ navigation }) {
  const [caption, setCaption] = useState("");
  const [mediaAsset, setMediaAsset] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Media permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const nextMediaType = asset.type === "video" ? "video" : "image";
    setMediaAsset(asset);
    setMediaType(nextMediaType);
    setUploading(true);
    setError("");

    try {
      const uploaded = nextMediaType === "video" ? await uploadStoryVideo(asset) : await uploadStoryImage(asset);
      setMediaUrl(uploaded.public_url || "");
    } catch (err) {
      setMediaUrl("");
      setError(err?.message || "Story media upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!mediaUrl) {
      setError("Upload an image or video first.");
      return;
    }

    setPublishing(true);
    setError("");
    try {
      await createStory({
        media_type: mediaType,
        media_url: mediaUrl,
        caption: caption || null,
      });
      navigation.navigate("Home", { storyRefreshAt: Date.now() });
    } catch (err) {
      setError(err?.message || "Unable to publish story");
      setPublishing(false);
      return;
    }

    Alert.alert("Story published", "Your story is now live for 24 hours.");
  };

  const resolvedUri = mediaAsset?.uri || toDisplayMediaUrl(mediaUrl);

  return (
    <PageCard>
      <ScreenHeader title="Create Story" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.label}>Caption</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          style={[styles.input, styles.textArea]}
          multiline
          placeholder="Add a short caption"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Media</Text>
        {resolvedUri ? (
          <View style={styles.previewWrap}>
            {mediaType === "video" ? (
              <Video
                source={{ uri: resolvedUri }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
                useNativeControls
              />
            ) : (
              <Image source={{ uri: resolvedUri }} style={styles.previewImage} resizeMode="cover" />
            )}
          </View>
        ) : (
          <PhotoPlaceholder label="Add photo or video" />
        )}

        <PrimaryButton label={mediaAsset ? "Select Another Media" : "Select Media"} onPress={pickMedia} variant="ghost" />
        {uploading ? <Text style={styles.hint}>Uploading story media...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={publishing ? "Publishing..." : "Publish Story"} onPress={onSubmit} />
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
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  previewWrap: {
    width: "100%",
    height: 360,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111",
  },
  hint: {
    ...typography.body,
    color: colors.success,
    marginVertical: spacing.md,
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginVertical: spacing.md,
  },
});
