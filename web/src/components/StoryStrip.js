import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchMyStories, fetchStoryFeed } from "../services/storiesApi";
import { toDisplayMediaUrl } from "../services/mediaUrl";

function StoryBubble({ label, onPress, active = false, own = false, previewUrl = "", mediaType = "image", seen = false }) {
  return (
    <Pressable onPress={onPress} style={styles.bubbleWrap}>
      <View style={[styles.ring, active && styles.ringActive, own && styles.ringOwn, seen && styles.ringSeen]}>
        <View style={styles.inner}>
          {previewUrl ? (
            <>
              <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="cover" />
              {mediaType === "video" ? (
                <View style={styles.videoBadge}>
                  <Ionicons name="play" size={14} color="#fff" />
                </View>
              ) : null}
            </>
          ) : own ? (
            <Ionicons name="add" size={24} color={colors.text} />
          ) : (
            <Text style={styles.initial}>{(label || "?").slice(0, 1).toUpperCase()}</Text>
          )}
        </View>
      </View>
      <Text numberOfLines={1} style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export default function StoryStrip({ navigation, refreshKey = 0 }) {
  const currentUserId = useSelector((state) => state.auth.user?.id);
  const [feed, setFeed] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const ownPreview = myStories[0] ? toDisplayMediaUrl(myStories[0].media_url) : "";
  const ownMediaType = myStories[0]?.media_type || "image";

  useEffect(() => {
    fetchStoryFeed().then((data) => setFeed(data || [])).catch(() => setFeed([]));
    fetchMyStories().then((data) => setMyStories(data || [])).catch(() => setMyStories([]));
  }, [refreshKey]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Stories</Text>
        <Pressable onPress={() => navigation.navigate("CreateStory")}>
          <Text style={styles.link}>Add Story</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <StoryBubble
          label="Your Story"
          own
          active={myStories.length > 0}
          previewUrl={ownPreview}
          mediaType={ownMediaType}
          seen={false}
          onPress={() =>
            myStories.length
              ? navigation.navigate("StoryViewer", {
                  stories: myStories,
                  userName: "Your Story",
                  initialIndex: 0,
                })
              : navigation.navigate("CreateStory")
          }
        />
        {feed.filter((group) => group.user_id !== currentUserId).map((group) => (
          <StoryBubble
            key={group.user_id}
            label={group.user_name || "Explorer"}
            active={!group.stories.every((story) => story.seen_by_me)}
            seen={group.stories.every((story) => story.seen_by_me)}
            onPress={() =>
              navigation.navigate("StoryViewer", {
                stories: group.stories,
                userName: group.user_name || "Explorer",
                initialIndex: 0,
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  link: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: "700",
  },
  row: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  bubbleWrap: {
    width: 90,
    alignItems: "center",
  },
  ring: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  ringActive: {
    backgroundColor: colors.secondary,
  },
  ringOwn: {
    backgroundColor: colors.primary,
  },
  ringSeen: {
    backgroundColor: colors.textMuted,
  },
  inner: {
    flex: 1,
    borderRadius: 34,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initial: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
  },
  videoBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(17,17,17,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
