import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import PageCard from "../components/PageCard";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { toDisplayMediaUrl } from "../services/mediaUrl";
import { deleteStory, recordStoryView, reportStory, setStoryHighlight } from "../services/storiesApi";

export default function StoryViewerScreen({ navigation, route }) {
  const currentUserId = useSelector((state) => state.auth.user?.id);
  const stories = route?.params?.stories || [];
  const userName = route?.params?.userName || "Story";
  const userProfilePic = route?.params?.userProfilePic || null;
  const initialIndex = Number(route?.params?.initialIndex || 0);
  const [index, setIndex] = useState(initialIndex);
  const [actionError, setActionError] = useState("");
  const [loadingMedia, setLoadingMedia] = useState(true);

  useEffect(() => {
    setIndex(initialIndex);
    setLoadingMedia(true);
  }, [initialIndex]);

  useEffect(() => {
    setLoadingMedia(true);
  }, [index]);

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerUserInfo}>
          <View style={styles.miniAvatar}>
            {userProfilePic ? (
              <Image source={{ uri: toDisplayMediaUrl(userProfilePic) }} style={styles.miniAvatarImage} />
            ) : (
              <View style={styles.miniAvatarPlaceholder}>
                <Text style={styles.miniAvatarText}>{(userName || "U").slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerUserName}>{userName}</Text>
        </View>
      </View>
      
      <View style={styles.viewer}>
        <View style={styles.progressRow}>
          {stories.map((item, currentIndex) => (
            <View key={item.id || currentIndex} style={[styles.progressBar, currentIndex <= index && styles.progressBarActive]} />
          ))}
        </View>
        {story.media_type === "video" ? (
          <video 
            src={toDisplayMediaUrl(story.media_url)} 
            style={[styles.video, loadingMedia && styles.hiddenMedia]} 
            controls 
            autoPlay 
            playsInline 
            onLoadedData={() => setLoadingMedia(false)}
          />
        ) : (
          <Image 
            source={{ uri: toDisplayMediaUrl(story.media_url) }} 
            style={[styles.media, loadingMedia && styles.hiddenMedia]} 
            resizeMode="cover" 
            onLoad={() => setLoadingMedia(false)}
          />
        )}
        {loadingMedia && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
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
            onPress={async () => {
              const reason = typeof window !== "undefined" ? window.prompt("Report reason", "Inappropriate story") : "Inappropriate story";
              if (!reason) return;
              setActionError("");
              try {
                await reportStory(story.id, reason);
                if (typeof window !== "undefined") window.alert("Story reported.");
              } catch (err) {
                setActionError(err?.message || "Story report failed");
              }
            }}
          />
        )}
        {isOwnStory ? (
          <PrimaryButton
            label="Delete"
            variant="ghost"
            onPress={async () => {
              const ok = typeof window === "undefined" ? true : window.confirm("Delete this story?");
              if (!ok) return;
              setActionError("");
              try {
                await deleteStory(story.id);
                navigation.goBack();
              } catch (err) {
                setActionError(err?.message || "Story delete failed");
              }
            }}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  miniAvatarImage: {
    width: "100%",
    height: "100%",
  },
  miniAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
  headerUserName: {
    ...typography.body,
    fontWeight: "800",
    color: colors.text,
  },
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
    height: 560,
    transition: "opacity 0.3s ease-in-out",
  },
  video: {
    width: "100%",
    height: 560,
    objectFit: "cover",
    backgroundColor: "#111",
    transition: "opacity 0.3s ease-in-out",
  },
  hiddenMedia: {
    opacity: 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    zIndex: 1,
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
