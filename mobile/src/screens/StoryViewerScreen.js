import { useEffect, useMemo, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import AppVideo from "../components/AppVideo";
import PageCard from "../components/PageCard";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { toDisplayMediaUrl } from "../services/mediaUrl";
import { deleteStory, recordStoryView, reportStory, setStoryHighlight } from "../services/storiesApi";
import { getAuthProfile } from "../services/authStore";

export default function StoryViewerScreen({ navigation, route }) {
  const stories = route?.params?.stories || [];
  const userName = route?.params?.userName || "Story";
  const initialIndex = Number(route?.params?.initialIndex || 0);
  const [index, setIndex] = useState(initialIndex);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);
  useEffect(() => {
    getAuthProfile().then((profile) => setCurrentUserId(profile?.id || null)).catch(() => setCurrentUserId(null));
  }, []);

  const story = stories[index];
  const isOwnStory = useMemo(() => !!story && story.user_id === currentUserId, [story, currentUserId]);
  useEffect(() => {
    if (!story?.id || isOwnStory) return;
    recordStoryView(story.id).catch(() => {});
  }, [story?.id, isOwnStory]);

  if (!story) {
    return (
      <PageCard>
        <ScreenHeader title="Story" onBack={() => navigation.goBack()} />
        <Text style={styles.empty}>No story available.</Text>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <ScreenHeader title={userName} onBack={() => navigation.goBack()} />
      <View style={styles.viewer}>
        <View style={styles.progressRow}>
          {stories.map((item, currentIndex) => (
            <View key={item.id || currentIndex} style={[styles.progressBar, currentIndex <= index && styles.progressBarActive]} />
          ))}
        </View>
        {story.media_type === "video" ? (
          <AppVideo
            source={{ uri: toDisplayMediaUrl(story.media_url) }}
            style={styles.media}
            contentFit="cover"
            autoPlay
            nativeControls
          />
        ) : (
          <Image source={{ uri: toDisplayMediaUrl(story.media_url) }} style={styles.media} resizeMode="cover" />
        )}
        <View style={styles.captionBox}>
          <Text style={styles.userName}>{userName}</Text>
          {story.caption ? <Text style={styles.caption}>{story.caption}</Text> : <Text style={styles.captionMuted}>No caption</Text>}
          {isOwnStory ? <Text style={styles.viewsText}>Views: {story.view_count ?? 0}</Text> : null}
          {isOwnStory && story.viewer_names?.length ? (
            <Text style={styles.viewerNames}>Viewed by: {story.viewer_names.join(", ")}</Text>
          ) : isOwnStory ? (
            <Text style={styles.viewerNames}>No viewers yet</Text>
          ) : null}
        </View>
      </View>
      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
      <View style={styles.actions}>
        <PrimaryButton label="Previous" variant="ghost" onPress={() => setIndex((value) => Math.max(0, value - 1))} />
        <PrimaryButton label="Add Story" variant="ghost" onPress={() => navigation.navigate("CreateStory")} />
        {isOwnStory ? (
          <PrimaryButton
            label={story.is_highlighted ? "Unhighlight" : "Highlight"}
            variant="ghost"
            onPress={async () => {
              setActionError("");
              try {
                await setStoryHighlight(story.id, !story.is_highlighted);
                navigation.goBack();
              } catch (err) {
                setActionError(err?.message || "Story update failed");
              }
            }}
          />
        ) : (
          <PrimaryButton
            label="Report"
            variant="ghost"
            onPress={() =>
              Alert.alert("Report story", "Report this story as inappropriate?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Report",
                  style: "destructive",
                  onPress: async () => {
                    setActionError("");
                    try {
                      await reportStory(story.id, "Inappropriate story");
                      Alert.alert("Reported", "Story reported.");
                    } catch (err) {
                      setActionError(err?.message || "Story report failed");
                    }
                  },
                },
              ])
            }
          />
        )}
        {isOwnStory ? (
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
                    setActionError("");
                    try {
                      await deleteStory(story.id);
                      navigation.goBack();
                    } catch (err) {
                      setActionError(err?.message || "Story delete failed");
                    }
                  },
                },
              ])
            }
          />
        ) : null}
        <PrimaryButton
          label={index >= stories.length - 1 ? "Done" : "Next"}
          onPress={() => (index >= stories.length - 1 ? navigation.goBack() : setIndex((value) => value + 1))}
        />
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  viewer: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressRow: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: spacing.xs,
    zIndex: 2,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  progressBarActive: {
    backgroundColor: "#fff",
  },
  media: {
    width: "100%",
    height: 520,
    backgroundColor: "#111",
  },
  captionBox: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: "rgba(17,17,17,0.58)",
  },
  userName: {
    ...typography.body,
    color: "#fff",
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  caption: {
    ...typography.body,
    color: "#fff",
  },
  captionMuted: {
    ...typography.body,
    color: "rgba(255,255,255,0.72)",
  },
  viewsText: {
    ...typography.caption,
    color: "#fff",
    marginTop: spacing.sm,
    fontWeight: "800",
  },
  viewerNames: {
    ...typography.caption,
    color: "rgba(255,255,255,0.86)",
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.md,
  },
});
