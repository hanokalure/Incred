import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
import { logout as logoutAction, updateUser } from "../store/slices/authSlice";
import { toDisplayMediaUrl } from "../services/mediaUrl";
import { uploadProfilePic } from "../services/authApi";

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

export default function ProfileScreen({ navigation }) {
  const { user, role } = useSelector((state) => state.auth);
  const language = useSelector((state) => state.lang.language);
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    savedCount: 0,
    storyCount: 0,
    submissionCount: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const handlePhotoPick = async () => {
    setIsMenuVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need camera roll permissions to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(name);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append("file", { uri, name, type });

      setUploading(true);
      try {
        const response = await uploadProfilePic(formData);
        if (response && response.profile_pic) {
          dispatch(updateUser({ profile_pic: response.profile_pic }));
        }
      } catch (err) {
        console.error("Upload failed", err);
        Alert.alert("Upload Failed", err.message || "Failed to upload profile picture.");
      } finally {
        setUploading(false);
      }
    }
  };

  const roleLabel = formatRole(role);
  const languageLabel = String(language || "en").toUpperCase();
  
  const profileFacts = useMemo(() => {
    return [
      { label: "Email", value: user?.email || "No email available", icon: "mail-outline" },
      { label: "Role", value: roleLabel, icon: role === "admin" ? "shield-checkmark-outline" : "compass-outline" },
      { label: "Language", value: languageLabel, icon: "language-outline" },
    ];
  }, [languageLabel, role, roleLabel, user?.email]);

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
      <View style={styles.topProfileSection}>
        <View style={styles.avatarContainer}>
          <Pressable onPress={() => setIsMenuVisible(true)} disabled={uploading} style={styles.avatarWrapper}>
            {user?.profile_pic ? (
              <Image source={{ uri: toDisplayMediaUrl(user.profile_pic) }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{(user?.name || "U").slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name={uploading ? "sync" : "camera"} size={20} color="#fff" />
            </View>
          </Pressable>
        </View>

        <View style={styles.userInfoCentered}>
          <Text style={styles.userNameCentered}>{user?.name || "Guest"}</Text>
          <Text style={styles.userMetaCentered}>{user?.email || ""}</Text>
          <View style={styles.roleBadgeCentered}>
            <Ionicons name={role === "admin" ? "sparkles-outline" : "compass-outline"} size={14} color={colors.primary} />
            <Text style={styles.roleTextCentered}>{roleLabel}</Text>
          </View>
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
          variant="ghost"
          onPress={async () => {
            await clearAuthToken();
            await clearAuthProfile();
            dispatch(logoutAction());
          }}
        />
      </View>

      {/* Choice Menu Modal */}
      <Modal visible={isMenuVisible} transparent animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsMenuVisible(false)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Profile Photo</Text>
            <Pressable 
              style={styles.menuItem} 
              onPress={() => {
                setIsMenuVisible(false);
                setIsViewerVisible(true);
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: "#E0F2F1" }]}>
                <Ionicons name="eye-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuItemText}>View Photo</Text>
            </Pressable>
            
            <Pressable style={styles.menuItem} onPress={handlePhotoPick}>
              <View style={[styles.menuIcon, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="create-outline" size={20} color="#E67E22" />
              </View>
              <Text style={styles.menuItemText}>Change Photo</Text>
            </Pressable>
            
            <Pressable style={[styles.menuItem, { marginTop: spacing.sm }]} onPress={() => setIsMenuVisible(false)}>
              <Text style={[styles.menuItemText, { color: colors.textMuted, width: "100%", textAlign: "center" }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={isViewerVisible} transparent animationType="slide" onRequestClose={() => setIsViewerVisible(false)}>
        <View style={styles.viewerOverlay}>
          <Pressable style={styles.viewerClose} onPress={() => setIsViewerVisible(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </Pressable>
          {user?.profile_pic ? (
            <Image 
              source={{ uri: toDisplayMediaUrl(user.profile_pic) }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          ) : (
            <View style={styles.viewerPlaceholder}>
              <Text style={styles.viewerInitial}>{(user?.name || "U").slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>
      </Modal>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  topProfileSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  avatarInitial: {
    fontSize: 56,
    fontWeight: "900",
    color: colors.primary,
  },
  editBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    backgroundColor: colors.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  userInfoCentered: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  userNameCentered: {
    ...typography.h2,
    fontSize: 28,
    color: colors.text,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
  },
  userMetaCentered: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  roleBadgeCentered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleTextCentered: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  menuCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: spacing.xl,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  menuTitle: {
    ...typography.h3,
    marginBottom: spacing.xl,
    color: colors.text,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 20,
    padding: 10,
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  viewerPlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerInitial: {
    fontSize: 100,
    fontWeight: "900",
    color: "#fff",
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
