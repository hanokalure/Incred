import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function PhotoPlaceholder({ label }) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 120,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
