import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PageCard from "../components/PageCard";
import ScreenHeader from "../components/ScreenHeader";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { toDisplayMediaUrl } from "../services/mediaUrl";

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value ?? 0}</Text>
    </View>
  );
}

export default function UserDetailScreen({ navigation, route }) {
  const user = route?.params?.user || null;

  if (!user) {
    return (
      <PageCard>
        <ScreenHeader title="User Details" onBack={() => navigation.goBack()} />
        <Text style={styles.emptyText}>User details are unavailable.</Text>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <ScreenHeader title={user.name || "User Details"} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.name || user.email || "U").slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{user.name || "Unnamed user"}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.role}>{String(user.role || "user").toUpperCase()}</Text>
            <Text style={styles.meta}>Joined: {user.created_at ? new Date(user.created_at).toLocaleString() : "Unknown"}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatBox label="Active Stories" value={user.active_story_count} />
          <StatBox label="Reviews" value={user.review_count} />
          <StatBox label="Saved" value={user.favorite_count} />
          <StatBox label="Itineraries" value={user.itinerary_count} />
          <StatBox label="Place Submissions" value={user.place_submission_count} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story Status</Text>
          <Text style={styles.sectionText}>
            {user.active_story_count
              ? `${user.active_story_count} active stor${user.active_story_count === 1 ? "y" : "ies"} available`
              : "No active stories"}
          </Text>
          {user.active_story_count ? (
            <Pressable
              style={styles.storyAction}
              onPress={() =>
                navigation.navigate("StoryViewer", {
                  stories: user.active_stories || [],
                  userName: user.name || user.email || "User Story",
                  initialIndex: 0,
                })
              }
            >
              <Text style={styles.storyActionText}>View Active Stories</Text>
            </Pressable>
          ) : null}
        </View>

        {user.latest_story ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Story Preview</Text>
            <View style={styles.previewCard}>
              <Image source={{ uri: toDisplayMediaUrl(user.latest_story.media_url) }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.previewMeta}>
                <Text style={styles.previewType}>{String(user.latest_story.media_type || "image").toUpperCase()}</Text>
                <Text style={styles.previewCaption}>{user.latest_story.caption || "No caption"}</Text>
                <Text style={styles.previewDate}>
                  {user.latest_story.created_at ? new Date(user.latest_story.created_at).toLocaleString() : ""}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: "row",
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
  },
  heroText: {
    flex: 1,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  role: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: "800",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    minWidth: 180,
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.sm,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  storyAction: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storyActionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  previewCard: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  previewImage: {
    width: "100%",
    height: 260,
  },
  previewMeta: {
    padding: spacing.md,
  },
  previewType: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  previewCaption: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  previewDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
