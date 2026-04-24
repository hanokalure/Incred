import { View, Text, StyleSheet, Switch, Pressable, FlatList, ActivityIndicator, Alert, Platform } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";
import { setLanguage } from "../store/slices/langSlice";
import { fetchNotifications, togglePushEnabled, markReadLocal, markAllReadLocal } from "../store/slices/notificationsSlice";
import { markNotificationAsRead, registerPushToken } from "../services/notificationsApi";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function ProfileSubScreen({ navigation, route }) {
  const title = route?.params?.title || "Details";
  const dispatch = useDispatch();
  const currentLanguage = useSelector((state) => state.lang.language);
  const { notifications, loading, pushEnabled, unreadCount, error: notifError } = useSelector((state) => state.notifications);
  
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  useEffect(() => {
    if (title === "Notifications") {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          registerPushToken(token).catch(err => console.error("Token reg failed", err));
        }
      });
      dispatch(fetchNotifications());
    }
  }, [title, dispatch]);

  const handleMarkAsRead = async (id, type) => {
    try {
      await markNotificationAsRead(id);
      dispatch(markReadLocal(id));

      // Admin workflow: navigate to approvals on tap
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

  const handleTogglePush = (val) => {
    dispatch(togglePushEnabled(val));
  };

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        // Alert.alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      // Alert.alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  // --- Rendering Helpers ---

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

  const renderNotificationItem = ({ item }) => {
    const icon = getIcon(item.type);
    return (
      <Pressable 
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
  };

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
                <Ionicons name={badge.icon} size={24} color={badge.color} />
              </View>
              <Text style={styles.badgeTitle}>{badge.title}</Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (title === "Reviews") {
      const [userReviews, setUserReviews] = useState([]);
      const [fetching, setFetching] = useState(false);

      const loadMyReviews = useCallback(async () => {
        setFetching(true);
        try {
          const { fetchMyReviews } = await import("../services/reviewsApi");
          const data = await fetchMyReviews();
          setUserReviews(data || []);
        } catch (err) {
          console.error("Failed to fetch reviews", err);
          Alert.alert("Error", "Could not load your reviews. Please try again later.");
        } finally {
          setFetching(false);
        }
      }, []);

      useEffect(() => {
        loadMyReviews();
      }, [loadMyReviews]);

      if (fetching) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;

      return (
        <View style={{ flex: 1 }}>
          <FlatList
            data={userReviews}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewPlace}>{item.place_name}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={colors.primary} />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{item.comment || "(No comment provided)"}</Text>
                <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>You haven't posted any reviews yet.</Text>
                <Pressable onPress={() => navigation.navigate("Home")} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Explore Places</Text>
                </Pressable>
              </View>
            }
          />
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
              <Text style={[styles.item, { marginBottom: 0 }]}>{lang.label}</Text>
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
        <View style={{ flex: 1 }}>

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

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : notifError ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
              <Text style={[styles.emptyText, { color: colors.error }]}>Failed to load notifications</Text>
              <Text style={styles.emptySubText}>{notifError}</Text>
              <Pressable onPress={() => dispatch(fetchNotifications())} style={styles.retryBtn}>
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={filteredNotifications}
              renderItem={renderNotificationItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.notifList}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>
                    {filter === "unread" ? "No unread notifications." : "No notifications yet."}
                  </Text>
                </View>
              }
              scrollEnabled={false}
            />
          )}
        </View>
      );
    }
    return <Text style={styles.item}>Content for {title} goes here.</Text>;
  };

  return (
    <PageCard>
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {renderBody()}
      </View>
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
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.text,
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
  notifList: {
    paddingBottom: spacing.xl,
  },
  notifItem: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
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
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  notifBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notifTime: {
    ...typography.caption,
    fontSize: 10,
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
    marginTop: 40,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptySubText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: -spacing.xs,
  },
  retryBtn: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
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
  toggleRow: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  reviewPlace: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "700",
  },
  reviewComment: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  badgeCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  badgeTitle: {
    ...typography.body,
    fontWeight: "800",
    color: colors.text,
  },
  badgeDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
});
