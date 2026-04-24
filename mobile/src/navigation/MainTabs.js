import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import SearchFilterScreen from "../screens/SearchFilterScreen"; // Now Discover
import ItineraryScreen from "../screens/ItineraryScreen";
import SavedListScreen from "../screens/SavedListScreen"; // Now Saved
import ProfileScreen from "../screens/ProfileScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 74,
          paddingBottom: 14,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Discover") iconName = focused ? "search" : "search-outline";
          else if (route.name === "Itinerary") iconName = focused ? "sparkles" : "sparkles-outline";
          else if (route.name === "Saved") iconName = focused ? "bookmark" : "bookmark-outline";
          else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Explore" }} />
      <Tab.Screen name="Discover" component={SearchFilterScreen} options={{ title: "Discover" }} />
      <Tab.Screen name="Itinerary" component={ItineraryScreen} options={{ title: "Itinerary" }} />
      <Tab.Screen name="Saved" component={SavedListScreen} options={{ title: "Saved" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
