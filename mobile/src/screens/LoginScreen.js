import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useDispatch } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import { login } from "../services/authApi";
import { setAuthProfile, setAuthToken } from "../services/authStore";
import { login as loginAction } from "../store/slices/authSlice";
import PageCard from "../components/PageCard";

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      if (!email.trim() || !password) {
        setError("Please enter email and password.");
        setStatus("idle");
        return;
      }
      const data = await login({ email, password });
      const normalizedRole = String(data?.user?.role || "user").trim().toLowerCase();
      const normalizedUser = data?.user ? { ...data.user, role: normalizedRole } : null;
      await setAuthToken(data.access_token);
      await setAuthProfile(normalizedUser);
      dispatch(loginAction({ user: normalizedUser, role: normalizedRole, token: data.access_token }));
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <PageCard hideHeader={false}>
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
          disabled={status === "loading"}
        />
        <View style={styles.spacer} />
        <PrimaryButton label="Create account" onPress={() => navigation.navigate("Register")} variant="ghost" />
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    justifyContent: "center",
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: typography.h1.color,
    letterSpacing: typography.h1.letterSpacing,
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
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
  },
  spacer: {
    height: spacing.sm,
  },
  error: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.error || "#C0392B",
    marginBottom: spacing.md,
    textAlign: "center",
  },
});
