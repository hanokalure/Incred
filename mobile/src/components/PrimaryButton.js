import { Pressable, Text, StyleSheet, Platform } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function PrimaryButton({ label, onPress, variant = "primary" }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "ghost" && styles.ghost,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, variant === "ghost" && styles.ghostText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  text: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
    fontWeight: "700",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  ghostText: {
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
