import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import { login } from "../services/authApi";
import { setAuthProfile, setAuthToken } from "../services/authStore";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await login({ email, password });
      const normalizedRole = String(data?.user?.role || "user").trim().toLowerCase();
      await setAuthToken(data.access_token);
      await setAuthProfile(data.user ? { ...data.user, role: normalizedRole } : null);
      // Always land users on the main experience after login.
      // Admins can still access "Add Place" from Profile.
      navigation.replace("MainTabs");
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        label={status === "loading" ? "Signing in..." : "Login"}
        onPress={handleLogin}
      />
      <View style={styles.spacer} />
      <PrimaryButton label="Create account" onPress={() => navigation.navigate("Register")} variant="ghost" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.text,
  },
  spacer: {
    height: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.error || "#C0392B",
    marginBottom: spacing.md,
    textAlign: "center",
  },
});
