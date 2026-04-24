import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Image, Alert, ScrollView, Switch } from "react-native";
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
import { uploadProfilePic, deleteProfilePic } from "../services/authApi";
import { togglePushEnabled } from "../store/slices/notificationsSlice";


function formatRole(role) {
  return String(role || "user").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SectionGroup({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.groupCard}>
        {children}
      </View>
    </View>
  );
}

function GroupItem({ icon, title, onPress, showDivider = true }) {
  return (
    <Pressable onPress={onPress} style={styles.groupItem}>
      <View style={styles.itemContent}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.itemIcon} />
        <Text style={styles.itemTitle}>{title}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
      {showDivider && <View style={styles.itemDivider} />}
    </Pressable>
  );
}

function ToggleItem({ icon, title, value, onValueChange, showDivider = true }) {
  return (
    <View style={styles.groupItem}>
      <View style={styles.itemContent}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.itemIcon} />
        <Text style={styles.itemTitle}>{title}</Text>
        <Switch 
          value={value} 
          onValueChange={onValueChange} 
          thumbColor={value ? colors.primary : "#f4f3f4"}
          trackColor={{ false: "#767577", true: colors.primary + "80" }}
        />
      </View>
      {showDivider && <View style={styles.itemDivider} />}
    </View>
  );
}


export default function ProfileScreen({ navigation }) {
  const { user, role } = useSelector((state) => state.auth);
  const { pushEnabled } = useSelector((state) => state.notifications);
  const language = useSelector((state) => state.lang.language);
  const dispatch = useDispatch();
  const [stats, setStats] = useState({ savedCount: 0, storyCount: 0, submissionCount: 0 });

  const [uploading, setUploading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

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

  useFocusEffect(useCallback(() => { loadProfileMetrics(); }, [loadProfileMetrics]));

  const handlePhotoPick = async () => {
    setIsMenuVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, name: asset.uri.split("/").pop(), type: `image/${asset.uri.split(".").pop()}` });
      setUploading(true);
      try {
        const response = await uploadProfilePic(formData);
        if (response?.profile_pic) dispatch(updateUser({ profile_pic: response.profile_pic }));
      } finally { setUploading(false); }
    }
  };

  return (
    <PageCard hideHeader={false}>
      {/* 1. HERO - Horizontal Layout */}
      <View style={styles.heroSection}>
        <Pressable onPress={() => setIsMenuVisible(true)} style={styles.heroAvatarWrap}>
          {user?.profile_pic ? (
            <Image source={{ uri: toDisplayMediaUrl(user.profile_pic) }} style={styles.heroAvatar} />
          ) : (
            <View style={styles.heroAvatarPlaceholder}><Ionicons name="person" size={40} color={colors.primary} /></View>
          )}
          <View style={styles.heroEditBadge}>
             <Ionicons name={uploading ? "sync" : "camera"} size={12} color="#FFF" />
          </View>
        </Pressable>
        <View style={styles.heroInfo}>
          <Text style={styles.heroName} numberOfLines={1}>{user?.name || "Guest User"}</Text>
          <Text style={styles.heroEmail} numberOfLines={1}>{user?.email || "Connect your account"}</Text>
          {role === "admin" && (
            <View style={styles.adminPill}><Ionicons name="shield-checkmark" size={10} color={colors.primary} /><Text style={styles.adminPillText}>ADMINISTRATOR</Text></View>
          )}
        </View>
      </View>

      {/* 2. STATS - Inline Instagram-style */}
      <View style={styles.statsStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.savedCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statLine} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.storyCount}</Text>
          <Text style={styles.statLabel}>Stories</Text>
        </View>
        <View style={styles.statLine} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.submissionCount}</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>
      </View>

      {/* 3. ACTIONS - iOS Grouped Style */}
      <SectionGroup title="CONTENT">
        <GroupItem icon="document-text-outline" title="My Submissions" onPress={() => navigation.navigate("MySubmissions")} />
        <GroupItem icon="albums-outline" title="Story Archive" onPress={() => navigation.navigate("StoryArchive")} />
        <GroupItem icon="chatbubble-ellipses-outline" title="My Reviews" onPress={() => navigation.navigate("ProfileReviews", { title: "Reviews" })} showDivider={false} />
      </SectionGroup>

      <SectionGroup title="PREFERENCES">
        <GroupItem icon="language-outline" title="App Language" onPress={() => navigation.navigate("Language", { title: "Language" })} />
        <GroupItem icon="trophy-outline" title="Achievements" onPress={() => navigation.navigate("Achievements", { title: "Achievements" })} />
        <ToggleItem icon="notifications-outline" title="Push Alerts" value={pushEnabled} onValueChange={(val) => dispatch(togglePushEnabled(val))} />
        <GroupItem icon="notifications-outline" title="Notification History" onPress={() => navigation.navigate("Notifications", { title: "Notifications" })} showDivider={false} />
      </SectionGroup>

      {role === "admin" && (
        <SectionGroup title="ADMINISTRATION">
          <GroupItem icon="add-circle-outline" title="Publish New Place" onPress={() => navigation.navigate("SubmitPlace")} />
          <GroupItem icon="shield-checkmark-outline" title="Place Approvals" onPress={() => navigation.navigate("PlaceApprovals")} showDivider={false} />
        </SectionGroup>
      )}

      <View style={styles.footer}>
        <Pressable 
          style={styles.logoutBtn} 
          onPress={async () => {
             await clearAuthToken(); await clearAuthProfile(); dispatch(logoutAction());
          }}
        >
          <Text style={styles.logoutText}>Logout Account</Text>
        </Pressable>
        <Text style={styles.version}>Version 1.0.4 • Made with ❤️ in Karnataka</Text>
      </View>

      {/* Choice Menu Modal */}
      <Modal visible={isMenuVisible} transparent animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsMenuVisible(false)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Profile Photo</Text>
            <Pressable style={styles.menuItem} onPress={() => { setIsMenuVisible(false); setIsViewerVisible(true); }}>
              <Ionicons name="eye-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <Text style={styles.menuItemText}>View Full Photo</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handlePhotoPick}>
              <Ionicons name="camera-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <Text style={styles.menuItemText}>Update Photo</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={isViewerVisible} transparent animationType="fade" onRequestClose={() => setIsViewerVisible(false)}>
        <View style={styles.viewerOverlay}>
          <Pressable style={styles.viewerClose} onPress={() => setIsViewerVisible(false)}><Ionicons name="close" size={30} color="#fff" /></Pressable>
          {user?.profile_pic ? (
            <Image source={{ uri: toDisplayMediaUrl(user.profile_pic) }} style={styles.fullImage} resizeMode="contain" />
          ) : (
            <View style={styles.viewerPlaceholder}><Ionicons name="person" size={120} color="#fff" /></View>
          )}
        </View>
      </Modal>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: 4,
    marginBottom: spacing.md,
  },
  heroAvatarWrap: {
    position: "relative",
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroEditBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  heroInfo: {
    flex: 1,
    marginLeft: spacing.lg,
    justifyContent: "center",
  },
  heroName: {
    ...typography.h2,
    fontSize: 22,
    color: colors.text,
  },
  heroEmail: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  adminPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    gap: 4,
  },
  adminPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 1,
  },

  statsStrip: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    ...typography.h3,
    fontSize: 18,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statLine: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },

  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginLeft: 4,
    marginBottom: 8,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  groupItem: {
    width: "100%",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  itemIcon: {
    marginRight: 16,
    width: 24,
    textAlign: "center",
  },
  itemTitle: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    fontWeight: "600",
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56, // Icon width (24) + Margin (16) + Padding (16)
  },

  footer: {
    alignItems: "center",
    marginTop: spacing.sm,
    paddingBottom: 40,
  },
  logoutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E74C3C",
    marginBottom: 16,
  },
  logoutText: {
    color: "#E74C3C",
    fontWeight: "700",
    fontSize: 14,
  },
  version: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  menuCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  menuTitle: {
    ...typography.h3,
    marginBottom: 20,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },

  viewerOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 60, right: 20, zIndex: 10 },
  fullImage: { width: "100%", height: "70%" },
  viewerPlaceholder: { alignSelf: "center", opacity: 0.5 },
});
