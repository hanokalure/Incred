import { View, Text, StyleSheet } from "react-native";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function UsersScreen() {
    return (
        <PageCard>
            <View style={styles.header}>
                <Text style={styles.title}>User Management</Text>
                <Text style={styles.subtitle}>View and manage registered users and their roles.</Text>
            </View>

            <View style={styles.placeholderCard}>
                <Text style={styles.icon}>👥</Text>
                <Text style={styles.placeholderText}>User management table is coming soon.</Text>
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
