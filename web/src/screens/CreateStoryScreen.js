import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";
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
  const [mediaType, setMediaType] = useState("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onFileChange = async (e) => {
    const selected = e?.target?.files?.[0] || null;
    if (!selected) return;

    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const nextMediaType = selected.type?.startsWith("video/") ? "video" : "image";
    setMediaType(nextMediaType);
    setPreviewUrl(URL.createObjectURL(selected));
    setUploading(true);
    setError("");

    try {
      const uploaded = nextMediaType === "video" ? await uploadStoryVideo(selected) : await uploadStoryImage(selected);
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
      navigation.navigate("Explore", { storyRefreshAt: Date.now() });
    } catch (err) {
      setError(err?.message || "Unable to publish story");
      setPublishing(false);
    }
  };

  return (
    <PageCard>
      <ScreenHeader title="Create Story" onBack={() => navigation.goBack()} />
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
      {previewUrl ? (
        <View style={styles.previewWrap}>
          {mediaType === "video" ? (
            <video src={previewUrl} style={styles.video} controls muted playsInline />
          ) : (
            <img src={previewUrl} alt="Story preview" style={styles.rawMedia} />
          )}
        </View>
      ) : mediaUrl ? (
        <View style={styles.previewWrap}>
          {mediaType === "video" ? (
            <video src={toDisplayMediaUrl(mediaUrl)} style={styles.video} controls muted playsInline />
          ) : (
            <Image source={{ uri: toDisplayMediaUrl(mediaUrl) }} style={styles.previewImage} resizeMode="cover" />
          )}
        </View>
      ) : (
        <PhotoPlaceholder label="Add photo or video" />
      )}

      <View style={styles.fileRow}>
        <input type="file" accept="image/*,video/*" onChange={onFileChange} />
      </View>

      {uploading ? <Text style={styles.hint}>Uploading story media...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={publishing ? "Publishing..." : "Publish Story"} onPress={onSubmit} />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
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
    minHeight: 100,
    textAlignVertical: "top",
  },
  previewWrap: {
    width: "100%",
    height: 380,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  rawMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    backgroundColor: "#111",
  },
  fileRow: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  hint: {
    ...typography.body,
    color: colors.success,
    marginBottom: spacing.md,
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.md,
  },
});
