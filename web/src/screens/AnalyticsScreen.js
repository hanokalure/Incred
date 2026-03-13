import { View, Text, StyleSheet } from "react-native";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function AnalyticsScreen() {
    return (
        <PageCard>
            <View style={styles.header}>
                <Text style={styles.title}>Analytics Insights</Text>
                <Text style={styles.subtitle}>Detailed performance metrics and user engagement data.</Text>
            </View>

            <View style={styles.placeholderCard}>
                <Text style={styles.icon}>📈</Text>
                <Text style={styles.placeholderText}>Data visualizations will appear here once connected to the backend.</Text>
            </View>
        </PageCard>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.h1,
        color: colors.text,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    placeholderCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl * 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 400,
    },
    icon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    placeholderText: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: "center",
    },
});
