import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import PageCard from "../components/PageCard";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { deleteStory, fetchMyStoryArchive, setStoryHighlight } from "../services/storiesApi";
import { toDisplayMediaUrl } from "../services/mediaUrl";

export default function StoryArchiveScreen({ navigation }) {
  const [stories, setStories] = useState([]);
  const [error, setError] = useState("");

  const loadStories = useCallback(() => {
    fetchMyStoryArchive()
      .then((data) => {
        setStories(data || []);
        setError("");
      })
      .catch((err) => {
        setStories([]);
        setError(err?.message || "Unable to load archive");
      });
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useFocusEffect(loadStories);

  return (
    <PageCard>
      <ScreenHeader title="Story Archive" onBack={() => navigation.goBack()} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!stories.length ? <Text style={styles.empty}>No expired stories in your archive yet.</Text> : null}
      <ScrollView contentContainerStyle={styles.grid}>
        {stories.map((story) => (
          <Pressable
            key={story.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate("StoryViewer", {
                stories: [story],
                userName: "Archive",
                initialIndex: 0,
              })
            }
          >
            {story.media_type === "video" ? (
              <video src={toDisplayMediaUrl(story.media_url)} style={styles.video} muted playsInline />
            ) : (
              <Image source={{ uri: toDisplayMediaUrl(story.media_url) }} style={styles.image} resizeMode="cover" />
            )}
            <View style={styles.meta}>
              <Text numberOfLines={2} style={styles.caption}>{story.caption || "No caption"}</Text>
              <Text style={styles.date}>{story.created_at ? new Date(story.created_at).toLocaleString() : ""}</Text>
              <Text style={styles.viewsText}>Views: {story.view_count ?? 0}</Text>
              <Text style={styles.viewerNames}>
                {story.viewer_names?.length ? `Viewed by: ${story.viewer_names.join(", ")}` : "No viewers yet"}
              </Text>
              <View style={styles.actionRow}>
                <PrimaryButton
                  label={story.is_highlighted ? "Unhighlight" : "Highlight"}
                  variant="ghost"
                  onPress={async () => {
                    await setStoryHighlight(story.id, !story.is_highlighted).catch(() => {});
                    loadStories();
                  }}
                />
                <PrimaryButton
                  label="Delete"
                  variant="ghost"
                  onPress={async () => {
                    const ok = typeof window === "undefined" ? true : window.confirm("Delete this story?");
                    if (!ok) return;
                    await deleteStory(story.id).catch(() => {});
                    loadStories();
                  }}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  card: {
    width: 260,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: "100%",
    height: 280,
  },
  video: {
    width: "100%",
    height: 280,
    objectFit: "cover",
    backgroundColor: "#111",
  },
  meta: {
    padding: spacing.md,
  },
  caption: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  viewsText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: "800",
  },
  viewerNames: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
