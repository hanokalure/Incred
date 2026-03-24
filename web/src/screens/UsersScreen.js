import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchAdminUsers } from "../services/adminApi";

export default function UsersScreen() {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAdminUsers()
            .then((res) => {
                setData(res);
                setError("");
            })
            .catch((err) => {
                setData(null);
                setError(err?.message || "Unable to load users.");
            });
    }, []);

    const users = data?.users || [];
    const summary = data?.summary || {};

    return (
        <PageCard>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>User Management</Text>
                    <Text style={styles.subtitle}>Live list of registered users and roles from the database.</Text>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Users</Text>
                        <Text style={styles.summaryValue}>{summary.total ?? "—"}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Admins</Text>
                        <Text style={styles.summaryValue}>{summary.admins ?? "—"}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Members</Text>
                        <Text style={styles.summaryValue}>{summary.members ?? "—"}</Text>
                    </View>
                </View>

                {users.length === 0 && !error ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No users found in the database yet.</Text>
                    </View>
                ) : (
                    users.map((user) => (
                        <View key={user.id} style={styles.userCard}>
                            <Text style={styles.userName}>{user.name || "Unnamed user"}</Text>
                            <Text style={styles.userMeta}>{user.email}</Text>
                            <Text style={styles.userRole}>{String(user.role || "user").toUpperCase()}</Text>
                        </View>
                    ))
                )}
            </ScrollView>
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
    summaryRow: {
        flexDirection: "row",
        gap: spacing.md,
        flexWrap: "wrap",
        marginBottom: spacing.lg,
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl,
        minWidth: 180,
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    summaryValue: {
        ...typography.h1,
        color: colors.text,
    },
    userCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    userName: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    userMeta: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    userRole: {
        ...typography.caption,
        color: colors.secondary,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
    },
    error: {
        ...typography.body,
        color: colors.error,
        marginBottom: spacing.md,
    },
});
