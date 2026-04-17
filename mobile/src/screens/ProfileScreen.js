import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import { clearAuthProfile, clearAuthToken } from "../services/authStore";
import PageCard from "../components/PageCard";
import { fetchSavedPlaceCards } from "../services/savedApi";
import { fetchMySubmissions } from "../services/placesApi";
import { fetchMyStoryArchive } from "../services/storiesApi";
import { logout as logoutAction } from "../store/slices/authSlice";

function StatCard({ label, value, icon, tone = "default" }) {
  return (
    <View style={[styles.statCard, tone === "primary" && styles.statCardPrimary]}>
      <View style={[styles.statIconWrap, tone === "primary" && styles.statIconWrapPrimary]}>
        <Ionicons
          name={icon}
          size={18}
          color={tone === "primary" ? colors.text : colors.secondary}
        />
      </View>
      <Text style={[styles.statValue, tone === "primary" && styles.statValuePrimary]}>{value}</Text>
      <Text style={[styles.statLabel, tone === "primary" && styles.statLabelPrimary]}>{label}</Text>
    </View>
  );
}

function ActionTile({ icon, title, detail, onPress, tone = "default" }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionTile, tone === "accent" && styles.actionTileAccent]}>
      <View style={[styles.actionIconWrap, tone === "accent" && styles.actionIconWrapAccent]}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDetail}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function formatRole(role) {
  return String(role || "user")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactId(id) {
  if (!id) return "Unavailable";
  const value = String(id);
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function ProfileScreen({ navigation }) {
  const { user, role } = useSelector((state) => state.auth);
  const language = useSelector((state) => state.lang.language);
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    savedCount: 0,
    storyCount: 0,
    submissionCount: 0,
  });

  const displayName = user?.name || user?.email?.split("@")[0] || "Explorer";
  const roleLabel = formatRole(role);
  const languageLabel = String(language || "en").toUpperCase();
  const profileFacts = useMemo(
    () => [
      { label: "Email", value: user?.email || "No email available", icon: "mail-outline" },
      { label: "Role", value: roleLabel, icon: role === "admin" ? "shield-checkmark-outline" : "compass-outline" },
      { label: "Language", value: languageLabel, icon: "language-outline" },
      { label: "Member ID", value: compactId(user?.id), icon: "finger-print-outline" },
    ],
    [languageLabel, role, roleLabel, user?.email, user?.id]
  );

  const quickActions = useMemo(
    () => [
      {
        key: "story-archive",
        title: "Story Archive",
        detail: `${stats.storyCount} stories in your archive`,
        icon: "albums-outline",
        onPress: () => navigation.navigate("StoryArchive"),
        tone: "accent",
      },
      {
        key: "my-submissions",
        title: "My Submissions",
        detail: `${stats.submissionCount} places submitted`,
        icon: "document-text-outline",
        onPress: () => navigation.navigate("MySubmissions"),
      },
      {
        key: "reviews",
        title: "My Reviews",
        detail: "See your travel notes and ratings",
        icon: "chatbubble-ellipses-outline",
        onPress: () => navigation.navigate("ProfileReviews", { title: "Reviews" }),
      },
      {
        key: "language",
        title: "App Language",
        detail: `Currently set to ${languageLabel}`,
        icon: "language-outline",
        onPress: () => navigation.navigate("Language", { title: "Language" }),
      },
      {
        key: "notifications",
        title: "Notifications",
        detail: "Manage alerts and updates",
        icon: "notifications-outline",
        onPress: () => navigation.navigate("Notifications", { title: "Notifications" }),
      },
      {
        key: "achievements",
        title: "Achievements",
        detail: "Track profile milestones and activity",
        icon: "trophy-outline",
        onPress: () => navigation.navigate("Achievements", { title: "Achievements" }),
      },
    ],
    [languageLabel, navigation, stats.storyCount, stats.submissionCount]
  );

  const creatorActions = useMemo(() => {
    const actions = [
      {
        key: "add-place",
        title: role === "admin" ? "Publish Place" : "Add Place",
        detail: role === "admin" ? "Create a listing with direct approval access" : "Submit a new place for review",
        icon: "add-circle-outline",
        onPress: () => navigation.navigate("SubmitPlace"),
        tone: "accent",
      },
    ];

    if (role === "admin") {
      actions.push({
        key: "approvals",
        title: "Place Approvals",
        detail: "Review pending community submissions",
        icon: "shield-checkmark-outline",
        onPress: () => navigation.navigate("PlaceApprovals"),
      });
    }

    return actions;
  }, [navigation, role]);

  const loadProfileMetrics = useCallback(() => {
    Promise.all([
      fetchSavedPlaceCards().catch(() => []),
      fetchMyStoryArchive().catch(() => []),
      fetchMySubmissions().catch(() => []),
    ]).then(([savedItems, stories, submissions]) => {
      setStats({
        savedCount: (savedItems || []).length,
        storyCount: (stories || []).length,
        submissionCount: (submissions || []).length,
      });
    });
  }, []);

  useEffect(() => {
    loadProfileMetrics();
  }, [loadProfileMetrics]);

  useFocusEffect(
    useCallback(() => {
      loadProfileMetrics();
    }, [loadProfileMetrics])
  );

  return (
    <PageCard>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroShell}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <View style={styles.heroTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name={role === "admin" ? "sparkles-outline" : "compass-outline"} size={14} color={colors.text} />
              <Text style={styles.heroBadgeText}>{roleLabel}</Text>
            </View>
          </View>

          <View style={styles.heroTextWrap}>
            <Text style={styles.eyebrow}>Account</Text>
            <Text style={styles.title}>{displayName}</Text>
            <Text style={styles.subtitle}>
              Your account center for saved places, submissions, stories, and app preferences.
            </Text>
          </View>

          <View style={styles.heroChips}>
            <View style={styles.heroChip}>
              <Ionicons name="bookmark-outline" size={14} color={colors.text} />
              <Text style={styles.heroChipText}>{stats.savedCount} saved</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="albums-outline" size={14} color={colors.text} />
              <Text style={styles.heroChipText}>{stats.storyCount} stories</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="document-text-outline" size={14} color={colors.text} />
              <Text style={styles.heroChipText}>{stats.submissionCount} submissions</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.sectionCaption}>Live account details from your active session</Text>
        </View>

        <View style={styles.statRow}>
          <StatCard label="saved places" value={stats.savedCount} icon="bookmark-outline" tone="primary" />
          <StatCard label="story archive" value={stats.storyCount} icon="albums-outline" />
          <StatCard label="submissions" value={stats.submissionCount} icon="document-text-outline" />
        </View>

        <View style={styles.infoCard}>
          {profileFacts.map((fact) => (
            <View key={fact.label} style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name={fact.icon} size={16} color={colors.secondary} />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>{fact.label}</Text>
                <Text style={styles.infoValue}>{fact.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionCaption}>Most-used profile and contribution areas</Text>
        </View>

        <View style={styles.actionGroup}>
          {quickActions.map((item) => (
            <ActionTile
              key={item.key}
              icon={item.icon}
              title={item.title}
              detail={item.detail}
              onPress={item.onPress}
              tone={item.tone}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{role === "admin" ? "Publishing Tools" : "Creator Tools"}</Text>
          <Text style={styles.sectionCaption}>
            {role === "admin" ? "Workflows available with admin access" : "Your contribution and submission workflow"}
          </Text>
        </View>

        <View style={styles.actionGroup}>
          {creatorActions.map((item) => (
            <ActionTile
              key={item.key}
              icon={item.icon}
              title={item.title}
              detail={item.detail}
              onPress={item.onPress}
              tone={item.tone}
            />
          ))}
        </View>

        <View style={styles.logoutSection}>
          <PrimaryButton
            label="Logout"
            onPress={async () => {
              await clearAuthToken();
              await clearAuthProfile();
              dispatch(logoutAction());
            }}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  heroShell: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
    position: "relative",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    right: -40,
    top: -50,
    backgroundColor: colors.accent,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 999,
    left: -20,
    bottom: -28,
    backgroundColor: "#FFF1B8",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255, 215, 0, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(206, 17, 38, 0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  heroBadgeText: {
    ...typography.caption,
    color: colors.text,
    letterSpacing: 0.4,
  },
  heroTextWrap: {
    marginBottom: spacing.md,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.secondary,
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: "92%",
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  heroChipText: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionCaption: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: 102,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCardPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statIconWrapPrimary: {
    backgroundColor: "rgba(255,255,255,0.26)",
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statValuePrimary: {
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statLabelPrimary: {
    color: "rgba(26,26,26,0.76)",
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoCopy: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
  },
  actionGroup: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  actionTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTileAccent: {
    backgroundColor: "#FFF6D6",
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  actionIconWrapAccent: {
    backgroundColor: "rgba(255,215,0,0.3)",
  },
  actionCopy: {
    flex: 1,
    marginRight: spacing.sm,
  },
  actionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  actionDetail: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.lg,
  },
});
