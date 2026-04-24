import { View, Text, StyleSheet, Switch, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";
import { setLanguage } from "../store/slices/langSlice";
import { loadNotifications, markReadLocal, markAllReadLocal } from "../store/slices/notificationsSlice";
import { markNotificationAsRead } from "../services/notificationsApi";

export default function ProfileSubScreen({ navigation, route }) {
  const title = route?.params?.title || "Details";
  const dispatch = useDispatch();
  const currentLanguage = useSelector((state) => state.lang?.language || "en");
  const { notifications, unreadCount, status } = useSelector((state) => state.notifications);

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (title === "Notifications") {
      dispatch(loadNotifications());
    }
  }, [title, dispatch]);

  const handleMarkAsRead = async (id, type) => {
    try {
      await markNotificationAsRead(id);
      dispatch(markReadLocal(id));
      if (type === "place_submission_request" || type === "media_submission_request") {
        navigation.navigate("PlaceApprovals");
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.allSettled(unread.map((n) => markNotificationAsRead(n.id)));
    dispatch(markAllReadLocal());
  };

  const getIcon = (type) => {
    if (type === "place_approval") return { name: "checkmark-circle", color: colors.success, bg: "#E8F5E9" };
    if (type === "place_rejection") return { name: "close-circle", color: colors.error, bg: "#FFEBEE" };
    if (type === "place_submission_request" || type === "media_submission_request")
      return { name: "shield-checkmark", color: colors.primary, bg: colors.accent };
    return { name: "notifications", color: colors.primary, bg: colors.accent };
  };

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const renderBody = () => {
    if (title === "Achievements") {
      const badges = [
        { id: "1", title: "Explorer", desc: "12 places visited", icon: "compass", color: "#3498DB", bg: "#EBF5FB" },
        { id: "2", title: "Foodie", desc: "5 reviews posted", icon: "restaurant", color: "#E67E22", bg: "#FEF5E7" },
        { id: "3", title: "Local Hero", desc: "2 places submitted", icon: "medal", color: "#F1C40F", bg: "#FEF9E6" },
      ];
      return (
        <View style={styles.badgeGrid}>
          {badges.map((badge) => (
            <View key={badge.id} style={styles.badgeCard}>
              <View style={[styles.badgeIconWrap, { backgroundColor: badge.bg }]}>
                <Ionicons name={badge.icon} size={28} color={badge.color} />
              </View>
              <Text style={styles.badgeTitle}>{badge.title}</Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (title === "Language") {
      const langs = [
        { key: "en", label: "English" },
        { key: "kn", label: "Kannada" },
        { key: "hi", label: "Hindi" },
      ];
      return (
        <View style={styles.listCard}>
          {langs.map((lang, idx) => (
            <Pressable
              key={lang.key}
              style={[styles.listItem, idx === langs.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => dispatch(setLanguage(lang.key))}
            >
              <Text style={styles.listItemText}>{lang.label}</Text>
              {currentLanguage === lang.key && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      );
    }

    if (title === "Notifications") {
      return (
        <View style={styles.notifContainer}>
          <View style={styles.notifHeader}>
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, filter === "all" && styles.tabActive]}
                onPress={() => setFilter("all")}
              >
                <Text style={[styles.tabText, filter === "all" && styles.tabTextActive]}>All Alerts</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, filter === "unread" && styles.tabActive]}
                onPress={() => setFilter("unread")}
              >
                <Text style={[styles.tabText, filter === "unread" && styles.tabTextActive]}>
                  Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
                </Text>
              </Pressable>
            </View>
            {unreadCount > 0 && (
              <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
                <Text style={styles.markAllText}>Mark all as read</Text>
              </Pressable>
            )}
          </View>

          {status === "loading" ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>
                {filter === "unread" ? "You're all caught up!" : "No notifications yet."}
              </Text>
              <Text style={styles.emptySubText}>We'll alert you when there's something new.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredNotifications.map((item) => {
                const icon = getIcon(item.type);
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.notifItem, !item.is_read && styles.notifUnread]}
                    onPress={() => handleMarkAsRead(item.id, item.type)}
                  >
                    <View style={[styles.notifIconWrap, { backgroundColor: icon.bg }]}>
                      <Ionicons name={icon.name} size={24} color={icon.color} />
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifTitleRow}>
                        <Text style={styles.notifTitle}>{String(item.title)}</Text>
                        {!item.is_read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notifBody}>{String(item.body)}</Text>
                      <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      );
    }
    return <Text style={styles.item}>Content for {title} goes here.</Text>;
  };

  return (
    <PageCard>
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
      <View style={styles.content}>{renderBody()}</View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: spacing.md, flex: 1 },
  item: { ...typography.body, marginBottom: spacing.md },

  // List Card (Language)
  listCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  listItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  listItemText: { fontSize: 16, fontWeight: "600", color: colors.text },

  // Badge Grid
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  badgeCard: { flex: 1, minWidth: 200, backgroundColor: colors.surface, borderRadius: 28, padding: 24, alignItems: "center", borderWidth: 1, borderColor: colors.border, elevation: 5, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  badgeIconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  badgeTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  badgeDesc: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginTop: 4 },

  // Notifications
  notifContainer: { flex: 1 },
  notifHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 25 },
  tabs: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  markAllBtn: { padding: 8 },
  markAllText: { fontSize: 13, color: colors.primary, fontWeight: "800" },

  notifItem: { flexDirection: "row", padding: 20, backgroundColor: colors.surface, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: colors.border, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5 },
  notifUnread: { borderColor: colors.primary, backgroundColor: colors.primary + "08" },
  notifIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 20 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notifTitle: { fontSize: 15, fontWeight: "800", color: colors.text, flex: 1 },
  notifBody: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 20 },
  notifTime: { fontSize: 11, color: colors.textMuted, marginTop: 8, fontWeight: "600" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginLeft: 15 },

  emptyWrap: { alignItems: "center", justifyContent: "center", marginTop: 80, gap: 15 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  emptyText: { fontSize: 18, fontWeight: "800", color: colors.text },
  emptySubText: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
});
