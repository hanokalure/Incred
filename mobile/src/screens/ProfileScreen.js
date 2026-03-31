import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import { clearAuthProfile, clearAuthToken, getAuthProfile } from "../services/authStore";

import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";

export default function ProfileScreen({ navigation }) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    getAuthProfile()
      .then((profile) => setRole(profile?.role || "user"))
      .catch(() => setRole("user"));
  }, []);

  return (
    <PageCard>
      <ScreenHeader title="Account Profile" onBack={() => navigation.goBack()} />
      <View style={styles.profileHeader}>
        <View style={styles.avatar} />
        <Text style={styles.name}>Varun Kumar</Text>
        <Text style={styles.role}>Explorer since 2024</Text>
      </View>

      <PrimaryButton label="Achievements" onPress={() => navigation.navigate("Achievements", { title: "Achievements" })} />
      <View style={styles.spacer} />
      <PrimaryButton label="My Reviews" onPress={() => navigation.navigate("ProfileReviews", { title: "Reviews" })} variant="ghost" />
      <View style={styles.spacer} />
      <PrimaryButton label="App Language" onPress={() => navigation.navigate("Language", { title: "Language" })} variant="ghost" />
      <View style={styles.spacer} />
      <PrimaryButton label="Notifications" onPress={() => navigation.navigate("Notifications", { title: "Notifications" })} variant="ghost" />

      <View style={styles.spacer} />
      <PrimaryButton label="Add Place" onPress={() => navigation.navigate("SubmitPlace")} />
      <View style={styles.spacer} />
      <PrimaryButton label="My Submissions" onPress={() => navigation.navigate("MySubmissions")} variant="ghost" />

      {role === "admin" ? (
        <>
          <View style={styles.spacer} />
          <PrimaryButton label="Place Approvals" onPress={() => navigation.navigate("PlaceApprovals")} variant="ghost" />
        </>
      ) : null}

      <View style={styles.logoutSection}>
        <PrimaryButton
          label="Logout"
          onPress={async () => {
            await clearAuthToken();
            await clearAuthProfile();
            navigation.replace("Login");
          }}
          variant="ghost"
        />
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h2,
  },
  role: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  spacer: {
    height: spacing.md,
  },
  logoutSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
