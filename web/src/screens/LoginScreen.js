import { useState, useEffect } from "react";
import { Text, TextInput, StyleSheet, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { login } from "../store/slices/authSlice";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import { login as loginApi } from "../services/authApi";
import { setAuthToken, getSavedCredentials, setSavedCredentials, clearSavedCredentials } from "../services/authStore";

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const creds = getSavedCredentials();
    if (creds && creds.email) {
      setEmail(creds.email);
      setPassword(creds.password);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async () => {
    setStatus("loading");
    setError("");
    try {
      if (!email.trim() || !password) {
        setError("Please enter email and password.");
        setStatus("idle");
        return;
      }
      const data = await loginApi({ email, password });
      setAuthToken(data.access_token);
      
      if (rememberMe) {
        setSavedCredentials({ email: email.trim(), password });
      } else {
        clearSavedCredentials();
      }
      
      dispatch(login({ user: data.user, role: data.user.role, token: data.access_token }));
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <PageCard scroll={false} contentStyle={styles.center}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue your Karnataka journey.</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showPassword}
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable 
        style={styles.rememberMeContainer} 
        onPress={() => setRememberMe(!rememberMe)}
      >
        <Ionicons 
          name={rememberMe ? "checkbox" : "square-outline"} 
          size={22} 
          color={rememberMe ? colors.primary : colors.textMuted} 
        />
        <Text style={styles.rememberMeText}>Remember me</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={status === "loading" ? "Signing in..." : "Login"} onPress={handleLogin} />

      <Text style={styles.helper}>New here?</Text>
      <PrimaryButton label="Create account" onPress={() => navigation.navigate("Register")} variant="ghost" />
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
    textAlign: "center",
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xl,
    color: colors.textSecondary,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    color: colors.text,
    outlineStyle: "none",
  },
  eyeIcon: {
    padding: spacing.md,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    width: "100%",
    justifyContent: "center",
  },
  rememberMeText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  helper: {
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  error: {
    color: colors.error || "#C0392B",
    marginBottom: spacing.md,
    textAlign: "center",
  },
});
