import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppVideo from "../components/AppVideo";
import PageCard from "../components/PageCard";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
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
      <ScrollView contentContainerStyle={styles.list}>
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
              <AppVideo
                source={{ uri: toDisplayMediaUrl(story.media_url) }}
                style={styles.video}
                contentFit="cover"
                loop
                autoPlay
                muted
                nativeControls
              />
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
                  onPress={() =>
                    Alert.alert("Delete story", "Delete this story?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          await deleteStory(story.id).catch(() => {});
                          loadStories();
                        },
                      },
                    ])
                  }
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
  list: {
    gap: spacing.lg,
  },
  card: {
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
