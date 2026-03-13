import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export default function AppStatusBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Phase 4 — UI scaffold active (API integration next)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
});
