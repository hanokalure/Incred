import { View, Text, StyleSheet } from "react-native";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function SettingsScreen() {
    return (
        <PageCard>
            <View style={styles.header}>
                <Text style={styles.title}>System Settings</Text>
                <Text style={styles.subtitle}>Configure global application behavior and features.</Text>
            </View>

            <View style={styles.placeholderCard}>
                <Text style={styles.icon}>⚙️</Text>
                <Text style={styles.placeholderText}>System configurations will be available here.</Text>
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
