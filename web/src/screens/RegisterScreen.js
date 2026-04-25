import { useState } from "react";
import { Text, TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import { signup } from "../services/authApi";
import { setAuthToken } from "../services/authStore";
import { useDispatch } from "react-redux";
import { login as loginAction } from "../store/slices/authSlice";

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setStatus("loading");
    setError("");
    try {
      if (!name.trim() || !email.trim() || !password) {
        setError("Please fill name, email, and password.");
        setStatus("idle");
        return;
      }
      const data = await signup({ name, email, password });
      if (data?.access_token) {
        setAuthToken(data.access_token);
        dispatch(loginAction({ user: data.user, role: data.user.role, token: data.access_token }));
      } else {
        navigation.goBack();
      }
    } catch (e) {
      setError(e.message || "Signup failed");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <PageCard scroll={false} contentStyle={styles.center} cardStyle={styles.card}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the local-first discovery community.</Text>
      <TextInput
        placeholder="Name"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        label={status === "loading" ? "Creating..." : "Sign up"}
        onPress={handleSignup}
      />
      <Text style={styles.helper}>Already have an account?</Text>
      <PrimaryButton label="Back to login" onPress={() => navigation.goBack()} variant="ghost" />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    padding: spacing.xl * 1.5,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.05)",
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
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
  error: {
    color: colors.error || "#C0392B",
    marginBottom: spacing.md,
  },
});
