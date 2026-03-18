import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import WebShell from "./WebShell";
import MainTabs from "./MainTabs";
import { fetchMe } from "../services/authApi";
import { clearAuthToken, getAuthToken, setAuthToken } from "../services/authStore";
import { login as loginAction, logout as logoutAction } from "../store/slices/authSlice";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setBooting(false);
      return;
    }

    // Restore session after refresh: validate token and load profile.
    fetchMe()
      .then((profile) => {
        setAuthToken(token); // ensure in-memory token is set
        dispatch(loginAction({ user: profile, role: profile.role, token }));
      })
      .catch(() => {
        clearAuthToken();
        dispatch(logoutAction());
      })
      .finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {booting ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="App" component={WebShell} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
