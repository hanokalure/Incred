import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import { clearAuthToken } from "../services/authStore";
import { logout } from "../store/slices/authSlice";
import { fetchSavedPlaceCards } from "../services/savedApi";
import { useLanguage } from "../context/LanguageContext";

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={colors.secondary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const [savedCount, setSavedCount] = useState(0);

  const loadSavedCount = useCallback(() => {
    fetchSavedPlaceCards()
      .then((items) => setSavedCount((items || []).length))
      .catch(() => setSavedCount(0));
  }, []);

  useEffect(() => {
    loadSavedCount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedCount();
    }, [loadSavedCount])
  );

  return (
    <PageCard>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "IK").slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.title}>{t("profileTitle")}</Text>
            <Text style={styles.subtitle}>{t("profileSubtitle")}</Text>
          </View>
        </View>

        <View style={styles.accountCard}>
          <Text style={styles.sectionTitle}>{t("accountOverview")}</Text>
          <Text style={styles.name}>{user?.name || "Explorer"}</Text>
          <Text style={styles.meta}>{user?.email || "No email found"}</Text>
          <Text style={styles.meta}>{t("role")}: {role || "user"}</Text>
          <Text style={styles.meta}>{t("language")}: {language.toUpperCase()}</Text>
        </View>

        <View style={styles.statRow}>
          <StatCard label={t("profileSavedCount")} value={savedCount} icon="bookmark-outline" />
          <StatCard label={t("role")} value={(role || "user").toUpperCase()} icon="shield-checkmark-outline" />
          <StatCard label={t("language")} value={language.toUpperCase()} icon="language-outline" />
        </View>

        <View style={styles.actionRow}>
          <PrimaryButton label="Story Archive" variant="ghost" onPress={() => navigation.navigate("StoryArchive")} />
        </View>

        <PrimaryButton
          label={t("signOut")}
          onPress={() => {
            clearAuthToken();
            dispatch(logout());
          }}
        />
      </ScrollView>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 12px 30px rgba(0,0,0,0.12)",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
  },
  heroTextWrap: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },
  actionRow: {
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: colors.accent,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
