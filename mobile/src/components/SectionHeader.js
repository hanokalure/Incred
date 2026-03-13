import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function SectionHeader({ title, action, onActionPress }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <Pressable onPress={onActionPress}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
  },
  action: {
    ...typography.body,
    fontSize: 14,
    color: colors.secondary,
    fontWeight: "700",
  },
});
