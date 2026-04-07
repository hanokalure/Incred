import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Pressable onPress={toggleTheme} style={styles.toggle}>
      <View style={[styles.knob, theme === "dark" && styles.knobRight]}>
        <Text style={styles.knobText}>{theme === "dark" ? "M" : "S"}</Text>
      </View>
      <Text style={styles.label}>{theme === "dark" ? "Night Mode" : "Sun Mode"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    minWidth: 132,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    boxShadow: "0px 12px 30px rgba(0,0,0,0.08)",
    backdropFilter: "blur(16px)",
  },
  knob: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  knobRight: {
    backgroundColor: colors.secondary,
  },
  knobText: {
    ...typography.caption,
    color: colors.text,
    letterSpacing: 0,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    letterSpacing: 1,
  },
});
