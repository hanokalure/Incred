import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import MainTabs from "./MainTabs";
import MapScreen from "../screens/MapScreen";
import NearbyScreen from "../screens/NearbyScreen";
import SearchFilterScreen from "../screens/SearchFilterScreen";
import DayPlanScreen from "../screens/DayPlanScreen";
import SavedListScreen from "../screens/SavedListScreen";
import ProfileSubScreen from "../screens/ProfileSubScreen";
import PlaceDetailScreen from "../screens/PlaceDetailScreen";
import ReviewsListScreen from "../screens/ReviewsListScreen";
import ReviewSubmitScreen from "../screens/ReviewSubmitScreen";
import SubmitPlaceScreen from "../screens/SubmitPlaceScreen";
import PlaceApprovalScreen from "../screens/PlaceApprovalScreen";
import MySubmissionsScreen from "../screens/MySubmissionsScreen";
import CreateStoryScreen from "../screens/CreateStoryScreen";
import StoryViewerScreen from "../screens/StoryViewerScreen";
import StoryArchiveScreen from "../screens/StoryArchiveScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="MainTabs" component={MainTabs} />

        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Nearby" component={NearbyScreen} />
        <Stack.Screen name="SearchFilter" component={SearchFilterScreen} />
        <Stack.Screen name="DayPlan" component={DayPlanScreen} />
        <Stack.Screen name="SavedList" component={SavedListScreen} />
        <Stack.Screen
          name="PlaceDetail"
          component={PlaceDetailScreen}
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="SubmitPlace" component={SubmitPlaceScreen} />
        <Stack.Screen name="MySubmissions" component={MySubmissionsScreen} />
        <Stack.Screen name="PlaceApprovals" component={PlaceApprovalScreen} />
        <Stack.Screen name="CreateStory" component={CreateStoryScreen} />
        <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
        <Stack.Screen name="StoryArchive" component={StoryArchiveScreen} />

        <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />
        <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} />

        <Stack.Screen name="Achievements" component={ProfileSubScreen} />
        <Stack.Screen name="ProfileReviews" component={ProfileSubScreen} />
        <Stack.Screen name="Language" component={ProfileSubScreen} />
        <Stack.Screen name="Notifications" component={ProfileSubScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
