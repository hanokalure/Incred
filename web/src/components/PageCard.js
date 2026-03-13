import { View, ScrollView, StyleSheet, Platform } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export default function PageCard({ children, scroll = true, contentStyle, cardStyle }) {
  if (scroll) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={[styles.content, contentStyle]}>
        <View style={[styles.card, cardStyle]}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.page}>
      <View style={[styles.content, contentStyle]}>
        <View style={[styles.card, cardStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  card: {
    width: "100%",
    maxWidth: 1100,
    backgroundColor: colors.elevated,
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.05)",
      },
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 32,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
