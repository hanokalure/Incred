import { View, ScrollView, StyleSheet, Platform } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { useResponsive } from "../hooks/useResponsive";

export default function PageCard({ children, scroll = true, contentStyle, cardStyle }) {
  const { isMobile } = useResponsive();
  
  const dynamicContentStyle = [
    styles.content,
    isMobile && styles.contentMobile,
    contentStyle,
  ];

  const dynamicCardStyle = [
    styles.card,
    isMobile && styles.cardMobile,
    cardStyle,
  ];

  if (scroll) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={dynamicContentStyle}>
        <View style={dynamicCardStyle}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.page}>
      <View style={dynamicContentStyle}>
        <View style={dynamicCardStyle}>{children}</View>
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
  contentMobile: {
    padding: spacing.sm,
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
  cardMobile: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 0,
    ...Platform.select({
      web: {
        boxShadow: "none",
      },
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
});
