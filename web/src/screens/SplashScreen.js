import { useEffect } from "react";
import { Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import PageCard from "../components/PageCard";

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 1200);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <PageCard scroll={false} contentStyle={styles.center} cardStyle={styles.card}>
      <Text style={styles.title}>Incredible Karnataka</Text>
      <Text style={styles.subtitle}>Discover the real Karnataka</Text>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    color: colors.textSecondary,
    ...typography.body,
  },
});
