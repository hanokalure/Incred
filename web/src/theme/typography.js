import { colors } from "./colors";

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.textSecondary,
    lineHeight: 24,
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
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subheading: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
};
