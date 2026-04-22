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
import { fetchNotifications, togglePushEnabled, markReadLocal } from "../store/slices/notificationsSlice";
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
  const { notifications, loading, pushEnabled } = useSelector((state) => state.notifications);
  
  // --- Push Notification Setup ---
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

  const renderNotificationItem = ({ item }) => {
    const isApprovalReq = item.type === "place_submission_request" || item.type === "media_submission_request";
    
    return (
      <Pressable 
        style={[styles.notifItem, !item.is_read && styles.notifUnread]} 
        onPress={() => handleMarkAsRead(item.id, item.type)}
      >
        <View style={styles.notifIconWrap}>
          <Ionicons 
              name={
                item.type === 'place_approval' ? "checkmark-circle" : 
                isApprovalReq ? "shield-checkmark" : "alert-circle"
              } 
              size={24} 
              color={
                item.type === 'place_approval' ? colors.success : 
                isApprovalReq ? colors.primary : colors.error
              } 
          />
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifBody}>{item.body}</Text>
          <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

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
          <View style={[styles.row, { marginBottom: spacing.lg }]}>
            <Text style={styles.item}>Push Notifications</Text>
            <Switch value={pushEnabled} onValueChange={handleTogglePush} />
          </View>
          
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.notifList}
              ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
              scrollEnabled={false} // PageCard handles scroll
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
    backgroundColor: colors.accent + '20', // Light primary tint
  },
  notifIconWrap: {
    marginRight: spacing.md,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
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
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  }
});
