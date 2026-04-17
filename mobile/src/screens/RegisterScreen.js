import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useDispatch } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import { signup } from "../services/authApi";
import { setAuthProfile, setAuthToken } from "../services/authStore";
import { login as loginAction } from "../store/slices/authSlice";

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      if (!name.trim() || !email.trim() || !password) {
        setError("Name, email, and password are required.");
        setStatus("idle");
        return;
      }
      const data = await signup({ name, email, password });
      if (data?.access_token) {
        const normalizedRole = String(data?.user?.role || "user").trim().toLowerCase();
        const normalizedUser = data?.user ? { ...data.user, role: normalizedRole } : null;
        await setAuthToken(data.access_token);
        await setAuthProfile(normalizedUser);
        dispatch(loginAction({ user: normalizedUser, role: normalizedRole, token: data.access_token }));
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
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput placeholder="Name" style={styles.input} value={name} onChangeText={setName} />
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
        label={status === "loading" ? "Creating..." : "Sign up"}
        onPress={handleSignup}
        disabled={status === "loading"}
      />
      <View style={styles.spacer} />
      <PrimaryButton label="Back to login" onPress={() => navigation.goBack()} variant="ghost" />
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
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: "center",
  },
});
