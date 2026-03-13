import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import ListingsScreen from "../screens/ListingsScreen";
import ItineraryScreen from "../screens/ItineraryScreen";
import SavedScreen from "../screens/SavedScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MapScreen from "../screens/MapScreen";
import NearbyScreen from "../screens/NearbyScreen";
import SearchFilterScreen from "../screens/SearchFilterScreen";
import DayPlanScreen from "../screens/DayPlanScreen";
import SavedListScreen from "../screens/SavedListScreen";
import PlaceDetailScreen from "../screens/PlaceDetailScreen";
import ReviewsListScreen from "../screens/ReviewsListScreen";
import ReviewSubmitScreen from "../screens/ReviewSubmitScreen";
import SubmitPlaceScreen from "../screens/SubmitPlaceScreen";
import ProfileSubScreen from "../screens/ProfileSubScreen";
import PlaceApprovalScreen from "../screens/PlaceApprovalScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import UsersScreen from "../screens/UsersScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();

const HEADER_HEIGHT = 72;
const SIDEBAR_WIDTH = 240;
const STRIP_WIDTH = 64;

const ADMIN_NAV = [
  { key: "Dashboard", label: "Overview", icon: "📊" },
  { key: "Approvals", label: "Approvals", icon: "✅" },
  { key: "Listings", label: "Manage Places", icon: "📍" },
  { key: "Analytics", label: "Insights", icon: "📈" },
  { key: "Users", label: "Users", icon: "👥" },
  { key: "Settings", label: "Settings", icon: "⚙️" },
];

const USER_NAV = [
  { key: "Explore", label: "Explore", icon: "🌍" },
  { key: "Discover", label: "Discover", icon: "🔍" },
  { key: "AI_Itinerary", label: "Itinerary", icon: "🤖" },
  { key: "Saved", label: "Saved", icon: "🔖" },
  { key: "Map", label: "Map", icon: "🗺️" },
  { key: "Profile", label: "Profile", icon: "👤" },
];

const ROUTE_TO_SECTION = {
  Dashboard: "Dashboard",
  Approvals: "Approvals",
  Listings: "Listings",
  Analytics: "Analytics",
  Users: "Users",
  Settings: "Settings",
  Explore: "Explore",
  Discover: "Discover",
  AI_Itinerary: "AI_Itinerary",
  Saved: "Saved",
  Map: "Map",
  Profile: "Profile",
};

export default function WebShell() {
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();
  const role = useSelector(state => state.auth.role);
  const NavItems = role === "admin" ? ADMIN_NAV : USER_NAV;

  const [active, setActive] = useState(NavItems[0].key);
  const [collapsed, setCollapsed] = useState(width < 1024);
  const navRef = useRef(null);

  useEffect(() => {
    setCollapsed(width < 1024);
  }, [width]);

  useEffect(() => {
    setActive(NavItems[0].key);
  }, [role]);

  const go = (key) => {
    setActive(key);
    navRef.current?.navigate(key);
  };

  const onNavStateChange = (state) => {
    const route = state?.routes?.[state.index];
    if (!route?.name) return;
    const section = ROUTE_TO_SECTION[route.name] || "Home";
    setActive(section);
  };

  const sidebarWidth = collapsed ? STRIP_WIDTH : SIDEBAR_WIDTH;

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => setCollapsed((v) => !v)} style={styles.hamburger}>
            <Text style={styles.hamburgerText}>≡</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{NavItems.find((n) => n.key === active)?.label || active}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.roleBadge}>{role?.toUpperCase()}</Text>
          <Pressable onPress={() => dispatch(logout())} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.sidebarWrap, { width: sidebarWidth }]}>
        <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
          <View style={styles.sidebarTop}>
            {!collapsed ? (
              <View style={styles.brandWrap}>
                <Text style={styles.brand}>Incredible</Text>
                <Text style={styles.brandSubtitle}>Karnataka</Text>
              </View>
            ) : (
              <Text style={styles.brandSmall}>IK</Text>
            )}
          </View>

          <View style={styles.navList}>
            {NavItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => go(item.key)}
                style={[styles.navItem, active === item.key && styles.navItemActive]}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                {!collapsed && (
                  <Text style={[styles.navText, active === item.key && styles.navTextActive]}>
                    {item.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.main, { marginLeft: sidebarWidth }]}
      >
        <View style={styles.content}>
          <NavigationIndependentTree>
            <NavigationContainer independent ref={navRef} onStateChange={onNavStateChange}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                {role === "admin" ? (
                  <>
                    <Stack.Screen name="Dashboard" component={HomeScreen} />
                    <Stack.Screen name="Approvals" component={PlaceApprovalScreen} />
                    <Stack.Screen name="Listings" component={ListingsScreen} />
                    <Stack.Screen name="Analytics" component={AnalyticsScreen} />
                    <Stack.Screen name="Users" component={UsersScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="Explore" component={HomeScreen} />
                    <Stack.Screen name="Discover" component={ListingsScreen} />
                    <Stack.Screen name="AI_Itinerary" component={ItineraryScreen} />
                    <Stack.Screen name="Saved" component={SavedScreen} />
                    <Stack.Screen name="Map" component={MapScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                  </>
                )}
                <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
                <Stack.Screen name="SubmitPlace" component={SubmitPlaceScreen} />
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
    gap: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.secondary,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
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
  sidebarTop: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  hamburger: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  hamburgerText: {
    fontSize: 20,
    color: colors.text,
  },
  brandWrap: {
    gap: -4,
  },
  brand: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1,
  },
  brandSmall: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.primary,
  },
  navList: {
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  navItemActive: {
    backgroundColor: colors.accent,
  },
  navIcon: {
    fontSize: 18,
    width: 28,
  },
  navText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  navTextActive: {
    color: colors.text,
    fontWeight: "700",
  },
  main: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
