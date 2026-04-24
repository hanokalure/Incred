import { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import { login } from "../services/authApi";
import { setAuthProfile, setAuthToken, getSavedCredentials, setSavedCredentials, clearSavedCredentials } from "../services/authStore";
import { login as loginAction } from "../store/slices/authSlice";
import PageCard from "../components/PageCard";

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    async function loadSaved() {
      const creds = await getSavedCredentials();
      if (creds && creds.email) {
        setEmail(creds.email);
        setPassword(creds.password);
        setRememberMe(true);
      }
    }
    loadSaved();
  }, []);

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
      
      if (rememberMe) {
        await setSavedCredentials({ email: email.trim(), password });
      } else {
        await clearSavedCredentials();
      }
      
      dispatch(loginAction({ user: normalizedUser, role: normalizedRole, token: data.access_token }));
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <PageCard hideHeader={true}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>
        <TextInput
          placeholder="Email"
          style={styles.input}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
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
          <Text style={styles.rememberMeText}>Remember Me</Text>
        </Pressable>

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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.lg,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
  },
  eyeIcon: {
    padding: spacing.lg,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingLeft: spacing.xs,
  },
  rememberMeText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginLeft: spacing.sm,
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
