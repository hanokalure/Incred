import { View, Text, StyleSheet, Switch, Pressable, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
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
  const { notifications, unreadCount, status, pushEnabled } = useSelector((state) => state.notifications);

  const [filter, setFilter] = useState("all"); // "all" | "unread"

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
    if (type === "place_approval") return { name: "checkmark-circle", color: colors.success };
    if (type === "place_rejection") return { name: "close-circle", color: colors.error };
    if (type === "place_submission_request" || type === "media_submission_request")
      return { name: "shield-checkmark", color: colors.primary };
    return { name: "notifications", color: colors.primary };
  };

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const renderBody = () => {
    if (title === "Achievements") {
      return (
        <View>
          <Text style={styles.item}>Explorer — 12 places visited</Text>
          <Text style={styles.item}>Foodie — 5 reviews posted</Text>
          <Text style={styles.item}>Local Hero — 2 places submitted</Text>
        </View>
      );
    }
    if (title === "Reviews") {
      return (
        <View>
          <Text style={styles.item}>You have posted 4 reviews.</Text>
          <Text style={styles.item}>Average rating: 4.5</Text>
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
        <View>
          {langs.map((lang) => (
            <Pressable
              key={lang.key}
              style={styles.langItem}
              onPress={() => dispatch(setLanguage(lang.key))}
            >
              <Text style={styles.item}>{lang.label}</Text>
              {currentLanguage === lang.key && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      );
    }
    if (title === "Notifications") {
      return (
        <View style={styles.notifContainer}>
          {/* Push toggle */}
          <View style={[styles.row, styles.toggleRow]}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.item}>Push Notifications</Text>
            </View>
            <Switch value={pushEnabled} thumbColor={colors.primary} />
          </View>

          {/* Header row: tabs + mark all read */}
          <View style={styles.notifHeader}>
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, filter === "all" && styles.tabActive]}
                onPress={() => setFilter("all")}
              >
                <Text style={[styles.tabText, filter === "all" && styles.tabTextActive]}>All</Text>
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
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            )}
          </View>

          {/* Notification list */}
          {status === "loading" ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {filter === "unread" ? "No unread notifications." : "No notifications yet."}
              </Text>
            </View>
          ) : (
            filteredNotifications.map((item) => {
              const icon = getIcon(item.type);
              return (
                <Pressable
                  key={item.id}
                  style={[styles.notifItem, !item.is_read && styles.notifUnread]}
                  onPress={() => handleMarkAsRead(item.id, item.type)}
                >
                  <View style={styles.notifIconWrap}>
                    <Ionicons name={icon.name} size={26} color={icon.color} />
                  </View>
                  <View style={styles.notifContent}>
                    <View style={styles.notifTitleRow}>
                      <Text style={styles.notifTitle}>{item.title}</Text>
                      {!item.is_read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notifBody}>{item.body}</Text>
                    <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
                  </View>
                </Pressable>
              );
            })
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
  content: {
    marginTop: spacing.md,
    flex: 1,
  },
  item: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleRow: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  notifContainer: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  tab: {
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  markAllBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  notifItem: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
  },
  notifUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "12",
  },
  notifIconWrap: {
    marginRight: spacing.md,
    paddingTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifTitle: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  notifBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  notifTime: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    flexShrink: 0,
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
