import { View, Text, StyleSheet, Platform } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function PlaceCard({ name, category, distance, rating }) {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{category}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.footer}>
          <Text style={styles.meta}>{distance} km away</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ {rating}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.elevated,
    borderRadius: 20,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.1)",
      },
    }),
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    padding: spacing.lg,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.info,
    fontSize: 10,
    fontWeight: "800",
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  meta: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "700",
    color: colors.warning,
  },
});
