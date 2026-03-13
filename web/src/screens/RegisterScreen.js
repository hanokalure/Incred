import { Text, TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";

export default function RegisterScreen({ navigation }) {
  return (
    <PageCard scroll={false} contentStyle={styles.center}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the local-first discovery community.</Text>
      <TextInput placeholder="Name" placeholderTextColor={colors.textMuted} style={styles.input} />
      <TextInput placeholder="Email" placeholderTextColor={colors.textMuted} style={styles.input} />
      <TextInput placeholder="Password" placeholderTextColor={colors.textMuted} secureTextEntry style={styles.input} />
      <PrimaryButton label="Sign up" onPress={() => navigation.replace("MainTabs")} />
      <Text style={styles.helper}>Already have an account?</Text>
      <PrimaryButton label="Back to login" onPress={() => navigation.goBack()} variant="ghost" />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  helper: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
