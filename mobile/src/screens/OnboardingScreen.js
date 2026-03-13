import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";

export default function OnboardingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Karnataka Story</Text>
      <Text style={styles.subtitle}>
        Discover authentic food, hidden gems, and generational businesses.
      </Text>
      <PrimaryButton label="Continue" onPress={() => navigation.navigate("Login")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
});
