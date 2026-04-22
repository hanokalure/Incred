import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import { clearAuthToken } from "../services/authStore";
import { logout, updateUser } from "../store/slices/authSlice";
import { fetchSavedPlaceCards } from "../services/savedApi";
import { useLanguage } from "../context/LanguageContext";
import { toDisplayMediaUrl } from "../services/mediaUrl";
import { uploadProfilePic } from "../services/authApi";

function QuickActionCard({ value, label }) {
  return (
    <View style={styles.quickCard}>
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, action }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {action && (
        <TouchableOpacity>
          <Text style={styles.sectionActionText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const [savedCount, setSavedCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const fileInputRef = useRef(null);

  const loadSavedCount = useCallback(() => {
    fetchSavedPlaceCards()
      .then((items) => setSavedCount((items || []).length))
      .catch(() => setSavedCount(0));
  }, []);

  useEffect(() => {
    loadSavedCount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedCount();
    }, [loadSavedCount])
  );

  const handlePhotoPick = () => {
    setIsMenuVisible(false);
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      alert("Image picking is only supported on Web version in this environment.");
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadProfilePic(file);
      if (response && response.profile_pic) {
        dispatch(updateUser({ profile_pic: response.profile_pic }));
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert(`Failed to upload profile picture: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageCard>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hidden File Input for Web */}
        {Platform.OS === "web" && (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={onFileChange}
          />
        )}

        <View style={styles.topProfileSection}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={() => setIsMenuVisible(true)} disabled={uploading} style={styles.avatarWrapper}>
              {user?.profile_pic ? (
                <Image source={{ uri: toDisplayMediaUrl(user.profile_pic) }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{(user?.name || "IK").slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                {uploading ? (
                  <Ionicons name="sync" size={20} color="#fff" />
                ) : (
                  <Ionicons name="camera" size={20} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.userInfoCentered}>
            <Text style={styles.userNameCentered}>{user?.name || "Guest"}</Text>
            <Text style={styles.userMetaCentered}>
              {user?.email || ""}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{role || "User"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <SectionTitle title="Community Actions" action="View" />
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.outlinedBtn} onPress={() => navigation.navigate("SubmitPlace")}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.outlinedBtnText}>Submit a New Place</Text>
            </TouchableOpacity>

            {role === "admin" && (
              <TouchableOpacity style={[styles.outlinedBtn, styles.adminBtn]} onPress={() => navigation.navigate("AdminDashboard")}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                <Text style={styles.outlinedBtnText}>Admin Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>

          <SectionTitle title="Travel stats" action="Overall" />
          <View style={styles.statsRow}>
            <QuickActionCard value={savedCount.toString()} label="Saved places" />
            <QuickActionCard value="0" label="Trips planned" />
            <QuickActionCard value="—" label="Cities explored" />
          </View>

          <SectionTitle title="Archives" />
          <TouchableOpacity style={styles.outlinedBtn} onPress={() => navigation.navigate("StoryArchive")}>
            <Ionicons name="images-outline" size={20} color={colors.text} />
            <Text style={[styles.outlinedBtnText, { color: colors.text }]}>Story Archive</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <PrimaryButton
              label={t("signOut")}
              variant="danger"
              style={styles.logoutBtn}
              onPress={() => {
                clearAuthToken();
                dispatch(logout());
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Choice Menu Modal */}
      {isMenuVisible && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setIsMenuVisible(false)} />
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Profile Photo</Text>
            <TouchableOpacity 
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
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handlePhotoPick}>
              <View style={[styles.menuIcon, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="create-outline" size={20} color="#E67E22" />
              </View>
              <Text style={styles.menuItemText}>Change Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, { marginTop: spacing.sm }]} onPress={() => setIsMenuVisible(false)}>
              <Text style={[styles.menuItemText, { color: colors.textMuted, width: "100%", textAlign: "center" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image Viewer Modal */}
      {isViewerVisible && (
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerBackdrop} activeOpacity={1} onPress={() => setIsViewerVisible(false)} />
          <View style={styles.viewerContent}>
            <TouchableOpacity style={styles.viewerClose} onPress={() => setIsViewerVisible(false)}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            {user?.profile_pic ? (
              <Image source={{ uri: toDisplayMediaUrl(user.profile_pic) }} style={styles.fullImage} resizeMode="contain" />
            ) : (
              <View style={styles.viewerPlaceholder}>
                <Text style={styles.viewerInitial}>{(user?.name || "U").slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </PageCard>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
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
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.surface,
    borderWidth: 6,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
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
    fontSize: 72,
    fontWeight: "900",
    color: colors.primary,
  },
  editBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
  },
  userInfoCentered: {
    alignItems: "center",
  },
  userNameCentered: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
  },
  userMetaCentered: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  roleBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 10,
  },
  body: {
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitleText: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  sectionActionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
  },
  actionsContainer: {
    gap: spacing.md,
  },
  outlinedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  adminBtn: {
    borderColor: colors.primary,
  },
  outlinedBtnText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
  },
  quickValue: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  quickLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: spacing.xxl,
  },
  logoutBtn: {
    borderRadius: 18,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  menuCard: {
    width: "85%",
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: "center",
    boxShadow: "0px 20px 50px rgba(0,0,0,0.3)",
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  viewerContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerClose: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullImage: {
    width: "90%",
    height: "70%",
  },
  viewerPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerInitial: {
    fontSize: 80,
    fontWeight: "900",
    color: "#fff",
  },
});
