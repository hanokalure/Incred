import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Modal } from "react-native";
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
import { supabase } from "../services/supabaseClient";
import { getAuthToken } from "../services/authStore";

function SectionGroup({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{String(title)}</Text>
      <View style={styles.groupCard}>
        {children}
      </View>
    </View>
  );
}

function GroupItem({ icon, title, onPress, showDivider = true }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.groupItem} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.itemIcon} />
        <Text style={styles.itemTitle}>{String(title)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
      {showDivider ? <View style={styles.itemDivider} /> : null}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ saved: 0, stories: 0, submissions: 0 });
  const [uploading, setUploading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const fileInputRef = useRef(null);

  const loadMetrics = useCallback(() => {
    fetchSavedPlaceCards().then((items) => {
      setStats({ saved: (items || []).length, stories: 0, submissions: 0 });
    }).catch(() => {});
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);
  useFocusEffect(useCallback(() => { loadMetrics(); }, [loadMetrics]));

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const response = await uploadProfilePic(file);
      if (response?.profile_pic) dispatch(updateUser({ profile_pic: response.profile_pic }));
    } catch (err) { alert(`Upload failed: ${err.message}`); }
    finally { setUploading(false); }
  };

  return (
    <PageCard>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {Platform.OS === "web" && (
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={onFileChange} />
        )}

        {/* 1. HERO - Horizontal */}
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.avatarWrap}>
            <View style={styles.avatarWrapper}>
              {user?.profile_pic ? (
                <Image source={{ uri: toDisplayMediaUrl(user.profile_pic) }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}><Ionicons name="person" size={40} color={colors.primary} /></View>
              )}
            </View>
            <View style={styles.editBadge}>
              <Ionicons name={uploading ? "sync" : "camera"} size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={1}>{String(user?.name || "Guest User")}</Text>
            <Text style={styles.heroEmail} numberOfLines={1}>{String(user?.email || "Connect your account")}</Text>
            {role === "admin" ? (
              <View style={styles.adminPill}>
                <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                <Text style={styles.adminPillText}>ADMINISTRATOR</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* 2. STATS - Instagram Style */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}><Text style={styles.statNum}>{String(stats.saved)}</Text><Text style={styles.statLabel}>Saved</Text></View>
          <View style={styles.statLine} />
          <View style={styles.statBox}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Stories</Text></View>
          <View style={styles.statLine} />
          <View style={styles.statBox}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Submissions</Text></View>
        </View>

        {/* 3. ACTIONS - iOS Grouped */}
        <SectionGroup title="CONTENT">
          <GroupItem icon="document-text-outline" title="My Submissions" onPress={() => navigation.navigate("MySubmissions")} />
          <GroupItem icon="images-outline" title="Story Archive" onPress={() => navigation.navigate("StoryArchive")} />
          <GroupItem icon="chatbubble-ellipses-outline" title="My Reviews" onPress={() => navigation.navigate("MyReviews")} showDivider={false} />
        </SectionGroup>

        <SectionGroup title="PREFERENCES">
          <GroupItem icon="language-outline" title="Language" onPress={() => navigation.navigate("Language")} />
          <GroupItem icon="notifications-outline" title="Notifications" onPress={() => navigation.navigate("Notifications")} showDivider={false} />
        </SectionGroup>

        {role === "admin" ? (
          <SectionGroup title="ADMINISTRATION">
            <GroupItem icon="add-circle-outline" title="Submit Place" onPress={() => navigation.navigate("SubmitPlace")} />
            <GroupItem icon="apps-outline" title="Dashboard" onPress={() => navigation.navigate("AdminDashboard")} showDivider={false} />
          </SectionGroup>
        ) : null}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={() => { clearAuthToken(); dispatch(logout()); }}
          >
            <Text style={styles.logoutText}>Logout Account</Text>
          </TouchableOpacity>
          <Text style={styles.version}>Version 1.0.4 • Made with ❤️ in Karnataka</Text>
        </View>
      </ScrollView>

      {/* Profile Photo Menu */}
      {isMenuVisible ? (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setIsMenuVisible(false)} />
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Profile Photo</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); setIsViewerVisible(true); }}>
              <Ionicons name="eye-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <Text style={styles.menuItemText}>View Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); fileInputRef.current?.click(); }}>
              <Ionicons name="camera-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <Text style={styles.menuItemText}>Change Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setIsMenuVisible(false)}>
              <Text style={{ flex: 1, textAlign: "center", color: colors.textMuted, fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Viewer Modal */}
      {isViewerVisible ? (
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setIsViewerVisible(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {user?.profile_pic ? (
            <Image source={{ uri: toDisplayMediaUrl(user.profile_pic) }} style={styles.fullImage} resizeMode="contain" />
          ) : (
            <View style={styles.viewerPlaceholder}><Ionicons name="person" size={150} color="#fff" /></View>
          )}
        </View>
      ) : null}
    </PageCard>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: spacing.lg, paddingBottom: 60 },
  
  heroSection: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xl },
  avatarWrap: { position: "relative" },
  avatarWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  editBadge: { position: "absolute", right: 0, bottom: 0, backgroundColor: colors.primary, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.background, alignItems: "center", justifyContent: "center" },
  
  heroInfo: { flex: 1, marginLeft: 20 },
  heroName: { ...typography.h2, fontSize: 22, color: colors.text, fontWeight: "900" },
  heroEmail: { ...typography.body, fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  adminPill: { flexDirection: "row", alignItems: "center", backgroundColor: colors.accent, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8, gap: 4 },
  adminPillText: { fontSize: 10, fontWeight: "900", color: colors.primary, letterSpacing: 1 },

  statsStrip: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 20, paddingVertical: 16, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl, alignItems: "center" },
  statBox: { flex: 1, alignItems: "center" },
  statNum: { ...typography.h3, fontSize: 18, color: colors.text },
  statLabel: { ...typography.caption, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statLine: { width: 1, height: 24, backgroundColor: colors.border },

  section: { marginBottom: spacing.xl },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.5, marginLeft: 4, marginBottom: 8 },
  groupCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  groupItem: { width: "100%" },
  itemContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  itemIcon: { marginRight: 16, width: 24, textAlign: "center" },
  itemTitle: { ...typography.body, flex: 1, color: colors.text, fontWeight: "600" },
  itemDivider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },

  footer: { alignItems: "center", marginTop: spacing.md },
  logoutBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, borderWidth: 1, borderColor: "#E74C3C", marginBottom: 16 },
  logoutText: { color: "#E74C3C", fontWeight: "700", fontSize: 14 },
  version: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },

  modalOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, justifyContent: "center", alignItems: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  menuCard: { width: 300, backgroundColor: colors.background, borderRadius: 24, padding: 24, alignItems: "center" },
  menuTitle: { ...typography.h3, marginBottom: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", width: "100%", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemText: { ...typography.body, fontWeight: "600", color: colors.text },

  viewerOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2000, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  viewerClose: { position: "absolute", top: 40, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: "90%", height: "70%" },
  viewerPlaceholder: { opacity: 0.5 },
});
