import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { getAuthToken } from "../services/authStore";

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const token = await getAuthToken();
      if (!active) return;
      if (!token) {
        navigation.replace("Onboarding");
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incredible Karnataka</Text>
      <Text style={styles.subtitle}>Discover the real Karnataka</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    marginTop: 8,
    color: colors.text,
    opacity: 0.8,
    fontWeight: "600",
  },
});
