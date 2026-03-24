import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchAdminSettings } from "../services/adminApi";

export default function SettingsScreen() {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAdminSettings()
            .then((res) => {
                setData(res);
                setError("");
            })
            .catch((err) => {
                setData(null);
                setError(err?.message || "Unable to load settings.");
            });
    }, []);

    const quality = data?.data_quality || {};
    const districts = data?.districts || [];

    return (
        <PageCard>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>System Settings</Text>
                    <Text style={styles.subtitle}>Current data quality and district setup from the database.</Text>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.settingsGrid}>
                    <View style={styles.settingsCard}>
                        <Text style={styles.settingsLabel}>Districts Configured</Text>
                        <Text style={styles.settingsValue}>{quality.districts_configured ?? "—"}</Text>
                    </View>
                    <View style={styles.settingsCard}>
                        <Text style={styles.settingsLabel}>Missing Descriptions</Text>
                        <Text style={styles.settingsValue}>{quality.places_missing_description ?? "—"}</Text>
                    </View>
                    <View style={styles.settingsCard}>
                        <Text style={styles.settingsLabel}>Missing Images</Text>
                        <Text style={styles.settingsValue}>{quality.places_missing_images ?? "—"}</Text>
                    </View>
                    <View style={styles.settingsCard}>
                        <Text style={styles.settingsLabel}>Missing Coordinates</Text>
                        <Text style={styles.settingsValue}>{quality.places_missing_coordinates ?? "—"}</Text>
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Configured Districts</Text>
                    {districts.length === 0 && !error ? (
                        <Text style={styles.emptyText}>No districts were found in the database.</Text>
                    ) : (
                        districts.map((district) => (
                            <Text key={district.id} style={styles.districtItem}>{district.name}</Text>
                        ))
                    )}
                </View>
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
    settingsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    settingsCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl,
        minWidth: 220,
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
    },
    settingsLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    settingsValue: {
        ...typography.h1,
        color: colors.text,
    },
    sectionCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.md,
    },
    districtItem: {
        ...typography.body,
        color: colors.text,
        marginBottom: spacing.sm,
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
