import { colors } from "./colors";
import { Platform } from "react-native";

export const typography = {
  h1: {
    fontSize: Platform.OS === 'web' ? 'clamp(24px, 4vw, 32px)' : 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: Platform.OS === 'web' ? 'clamp(20px, 3vw, 24px)' : 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: Platform.OS === 'web' ? 'clamp(16px, 2.5vw, 18px)' : 18,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: Platform.OS === 'web' ? 'clamp(14px, 2vw, 16px)' : 15,
    fontWeight: "400",
    color: colors.textSecondary,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Legacy mappings for backward compatibility
  heading: {
    fontSize: Platform.OS === 'web' ? 'clamp(22px, 3.5vw, 28px)' : 24,
    fontWeight: "700",
    color: colors.text,
  },
  subheading: {
    fontSize: Platform.OS === 'web' ? 'clamp(16px, 2.5vw, 18px)' : 16,
    fontWeight: "600",
    color: colors.text,
  },
};
