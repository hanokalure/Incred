import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { loadNotifications, markReadLocal } from "../store/slices/notificationsSlice";
import { markNotificationAsRead } from "../services/notificationsApi";
import { colors } from "../theme/colors";
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import ListingsScreen from "../screens/ListingsScreen";
import ItineraryScreen from "../screens/ItineraryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MapScreen from "../screens/MapScreen";
import DayPlanScreen from "../screens/DayPlanScreen";
import SavedListScreen from "../screens/SavedListScreen";
import PlaceDetailScreen from "../screens/PlaceDetailScreen";
import ReviewsListScreen from "../screens/ReviewsListScreen";
import ReviewSubmitScreen from "../screens/ReviewSubmitScreen";
import SubmitPlaceScreen from "../screens/SubmitPlaceScreen";
import MySubmissionsScreen from "../screens/MySubmissionsScreen";
import ProfileSubScreen from "../screens/ProfileSubScreen";
import PlaceApprovalScreen from "../screens/PlaceApprovalScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import UsersScreen from "../screens/UsersScreen";
import SettingsScreen from "../screens/SettingsScreen";
import CreateStoryScreen from "../screens/CreateStoryScreen";
import StoryArchiveScreen from "../screens/StoryArchiveScreen";
import StoryViewerScreen from "../screens/StoryViewerScreen";
import UserDetailScreen from "../screens/UserDetailScreen";
import { useLanguage } from "../context/LanguageContext";
import { getBrowserLocation } from "../utils/browserLocation";
import { reverseGeocodeLocation } from "../services/locationApi";
import { toDisplayMediaUrl } from "../services/mediaUrl";

const Stack = createNativeStackNavigator();

const HEADER_HEIGHT = 72;
const SIDEBAR_WIDTH = 240;
const STRIP_WIDTH = 72;

const ROUTE_TO_SECTION = {
  Dashboard: "Dashboard",
  Approvals: "Approvals",
  Listings: "Listings",
  SubmitPlace: "SubmitPlace",
  Analytics: "Analytics",
  Users: "Users",
  Settings: "Settings",
  Explore: "Explore",
  Discover: "Discover",
  SubmitPlace: "SubmitPlace",
  MySubmissions: "MySubmissions",
  AI_Itinerary: "AI_Itinerary",
  Saved: "Saved",
  SavedList: "Saved",
  Map: "Map",
  Profile: "Profile",
};

export default function WebShell() {
  const { width } = useWindowDimensions();
  const role = useSelector((state) => state.auth.role);
  const user = useSelector((state) => state.auth.user);
  const notifications = useSelector((state) => state.notifications.notifications) || [];
  const unreadCount = useSelector((state) => state.notifications.unreadCount) || 0;
  
  const dispatch = useDispatch();
  const { language, setLanguage, t } = useLanguage();
  const navRef = useRef(null);

  const adminNav = [
    { key: "Dashboard", label: t("navDashboard"), icon: "speedometer-outline" },
    { key: "Approvals", label: t("navApprovals"), icon: "checkmark-done-outline" },
    { key: "Listings", label: t("navListings"), icon: "map-outline" },
    { key: "SubmitPlace", label: t("navSubmitPlace"), icon: "add-circle-outline" },
    { key: "Analytics", label: t("navAnalytics"), icon: "bar-chart-outline" },
    { key: "Users", label: t("navUsers"), icon: "people-outline" },
    { key: "Settings", label: t("navSettings"), icon: "settings-outline" },
  ];
  const userNav = [
    { key: "Explore", label: t("navExplore"), icon: "compass-outline" },
    { key: "Discover", label: t("navDiscover"), icon: "search-outline" },
    { key: "SubmitPlace", label: t("navSubmitPlace"), icon: "add-circle-outline" },
    { key: "MySubmissions", label: t("navMySubmissions"), icon: "clipboard-outline" },
    { key: "AI_Itinerary", label: t("navItinerary"), icon: "sparkles-outline" },
    { key: "Saved", label: t("navSaved"), icon: "bookmark-outline" },
    { key: "Map", label: t("navMap"), icon: "map-outline" },
    { key: "Profile", label: t("navProfile"), icon: "person-outline" },
  ];
  const navItems = role === "admin" ? adminNav : userNav;
  const homeRoute = role === "admin" ? "Dashboard" : "Explore";

  const [active, setActive] = useState(homeRoute);
  const [collapsed, setCollapsed] = useState(width < 1024);
  const [locationText, setLocationText] = useState(t("locating"));
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    setCollapsed(width < 1024);
  }, [width]);

  useEffect(() => {
    setActive(homeRoute);
  }, [homeRoute]);

  useEffect(() => {
    setLocationText(t("locating"));
  }, [language, t]);

  useEffect(() => {
    if (user?.id) {
      dispatch(loadNotifications());
    }
  }, [user?.id, dispatch]);

  useEffect(() => {
    if (role === "admin") {
      setLocationText(t("adminWorkspace"));
      return;
    }

    getBrowserLocation()
      .then(async (location) => {
        try {
          const name = await reverseGeocodeLocation(location);
          setLocationText(name || t("locationActive"));
        } catch (error) {
          setLocationText(t("locationActive"));
        }
      })
      .catch(() => setLocationText(t("locationUnavailable")));
  }, [role, language, t]);

  const go = (key, params = {}) => {
    setActive(ROUTE_TO_SECTION[key] || key);
    navRef.current?.navigate(key, params);
  };

  const onNavStateChange = (state) => {
    const route = state?.routes?.[state.index];
    if (!route?.name) {
      return;
    }
    if (route.name === "PlaceDetail") {
      setActive(route.params?.sourceSection || active);
      return;
    }
    setActive(ROUTE_TO_SECTION[route.name] || homeRoute);
  };

  const handleBrandPress = () => {
    if (typeof window !== "undefined") {
      window.location.href = window.location.origin;
      return;
    }
    go(homeRoute);
  };

  const handleMarkAsRead = async (id, type) => {
    try {
      await markNotificationAsRead(id);
      dispatch(markReadLocal(id));

      if (type === "place_submission_request" || type === "media_submission_request") {
        setShowNotifs(false);
        go("Approvals");
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    for (const notif of notifications) {
      if (!notif.is_read) {
        await handleMarkAsRead(notif.id, notif.type);
      }
    }
  };

  const sidebarWidth = collapsed ? STRIP_WIDTH : SIDEBAR_WIDTH;

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => setCollapsed((value) => !value)} style={styles.hamburger}>
            <Text style={styles.hamburgerText}>≡</Text>
          </Pressable>
          <Pressable onPress={handleBrandPress} style={styles.brandCluster}>
            <Text style={styles.brandTitle}>Incredible Karnataka</Text>
            <Text style={styles.brandSubtitle}>{locationText}</Text>
          </Pressable>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.langSwitch}>
            {[
              { code: "en", label: "EN" },
              { code: "kn", label: "ಕ" },
              { code: "hi", label: "हि" },
            ].map((item) => (
              <Pressable
                key={item.code}
                onPress={() => setLanguage(item.code)}
                style={[styles.langPill, language === item.code && styles.langPillActive]}
              >
                <Text style={[styles.langText, language === item.code && styles.langTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.headerActions}>
            <Pressable 
              onPress={() => go("ProfileSub", { title: "Notifications" })} 
              style={styles.notifBtn}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>

            <Pressable onPress={() => go("Profile")} style={styles.profileBtn}>
              {user?.profile_pic ? (
                <Image source={{ uri: toDisplayMediaUrl(user.profile_pic) }} style={styles.navAvatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={26} color={colors.text} />
              )}
              {user?.name ? <Text style={styles.profileName}>{user.name.split(" ")[0]}</Text> : null}
            </Pressable>
          </View>
        </View>
      </View>

      <View style={[styles.sidebarWrap, { width: sidebarWidth }]}>
        <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
          <View style={styles.navList}>
            {navItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => go(item.key)}
                style={[styles.navItem, active === item.key && styles.navItemActive]}
              >
                <View style={styles.navIconWrap}>
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={active === item.key ? colors.text : colors.textSecondary}
                  />
                </View>
                {!collapsed ? (
                  <Text style={[styles.navText, active === item.key && styles.navTextActive]}>
                    {item.label}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.main, { marginLeft: sidebarWidth }]}>
        <View style={styles.content}>
          <NavigationIndependentTree>
            <NavigationContainer independent ref={navRef} onStateChange={onNavStateChange}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                {role === "admin" ? (
                  <>
                    <Stack.Screen name="Dashboard" component={HomeScreen} />
                    <Stack.Screen name="Approvals" component={PlaceApprovalScreen} />
                    <Stack.Screen name="Listings" component={ListingsScreen} />
                    <Stack.Screen name="SubmitPlace" component={SubmitPlaceScreen} />
                    <Stack.Screen name="Analytics" component={AnalyticsScreen} />
                    <Stack.Screen name="Users" component={UsersScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="Explore" component={HomeScreen} />
                    <Stack.Screen name="Discover" component={ListingsScreen} />
                    <Stack.Screen name="SubmitPlace" component={SubmitPlaceScreen} />
                    <Stack.Screen name="MySubmissions" component={MySubmissionsScreen} />
                    <Stack.Screen name="AI_Itinerary" component={ItineraryScreen} />
                    <Stack.Screen name="Saved" component={SavedListScreen} />
                    <Stack.Screen name="Map" component={MapScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                  </>
                )}
                <Stack.Screen
                  name="PlaceDetail"
                  component={PlaceDetailScreen}
                  options={{ presentation: "modal", animation: "slide_from_bottom" }}
                />
                <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />
                <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} />
                <Stack.Screen name="DayPlan" component={DayPlanScreen} />
                <Stack.Screen name="SavedList" component={SavedListScreen} />
                <Stack.Screen name="ProfileSub" component={ProfileSubScreen} />
                <Stack.Screen name="CreateStory" component={CreateStoryScreen} />
                <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
                <Stack.Screen name="StoryArchive" component={StoryArchiveScreen} />
                <Stack.Screen name="UserDetail" component={UserDetailScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </NavigationIndependentTree>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  notifBtn: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.error || "#F44336",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  notifBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  notifDropdown: {
    position: "absolute",
    top: 56,
    right: 48,
    width: 320,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    zIndex: 1000,
  },
  notifDropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifDropdownTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  markAllRead: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
  },
  notifList: {
    maxHeight: 400,
    overflow: "auto",
  },
  emptyNotifs: {
    padding: 32,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 14,
  },
  notifItem: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifItemUnread: {
    backgroundColor: "rgba(255,215,0,0.05)",
  },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  notifInfo: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  notifBody: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  hamburger: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  hamburgerText: {
    fontSize: 20,
    color: colors.text,
  },
  brandCluster: {
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  langSwitch: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    padding: 4,
    backgroundColor: colors.background,
  },
  langPill: {
    minWidth: 34,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
  },
  langPillActive: {
    backgroundColor: colors.primary,
  },
  langText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  langTextActive: {
    color: colors.text,
  },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  profileName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  navAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  sidebarWrap: {
    position: "absolute",
    top: HEADER_HEIGHT,
    left: 0,
    bottom: 0,
    zIndex: 20,
  },
  sidebar: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    padding: 12,
  },
  sidebarCollapsed: {
    alignItems: "center",
  },
  navList: {
    gap: 6,
    paddingTop: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  navItemActive: {
    backgroundColor: colors.accent,
  },
  navIconWrap: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
  },
  navTextActive: {
    color: colors.text,
    fontWeight: "800",
  },
  main: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
