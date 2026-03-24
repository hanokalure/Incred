import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchAdminAnalytics } from "../services/adminApi";
import { getPlaceCategoryLabel } from "../constants/placeCategories";

export default function AnalyticsScreen() {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAdminAnalytics()
            .then((res) => {
                setData(res);
                setError("");
            })
            .catch((err) => {
                setData(null);
                setError(err?.message || "Unable to load analytics.");
            });
    }, []);

    const overview = data?.overview || {};
    const categories = data?.categories || [];
    const districts = data?.districts || [];

    return (
        <PageCard>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Analytics Insights</Text>
                    <Text style={styles.subtitle}>Live database activity across places, reviews, and itineraries.</Text>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Places With Images</Text>
                        <Text style={styles.metricValue}>{overview.places_with_images ?? "—"}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Places With Coordinates</Text>
                        <Text style={styles.metricValue}>{overview.places_with_coordinates ?? "—"}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Favorites Logged</Text>
                        <Text style={styles.metricValue}>{overview.favorites_count ?? "—"}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Avg Review Rating</Text>
                        <Text style={styles.metricValue}>{overview.average_review_rating ?? "—"}</Text>
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Category Breakdown</Text>
                    {categories.length === 0 ? (
                        <Text style={styles.emptyText}>No category data available in the database yet.</Text>
                    ) : (
                        categories.map((item) => (
                            <View key={item.key} style={styles.row}>
                                <Text style={styles.rowLabel}>{getPlaceCategoryLabel(item.key)}</Text>
                                <Text style={styles.rowValue}>{item.count}</Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>District Coverage</Text>
                    {districts.length === 0 ? (
                        <Text style={styles.emptyText}>No district-linked places found yet.</Text>
                    ) : (
                        districts.map((item) => (
                            <View key={`${item.district_id}-${item.name}`} style={styles.row}>
                                <Text style={styles.rowLabel}>{item.name}</Text>
                                <Text style={styles.rowValue}>{item.count}</Text>
                            </View>
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
    metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    metricCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl,
        minWidth: 220,
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
    },
    metricLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    metricValue: {
        ...typography.h1,
        color: colors.text,
    },
    sectionCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    rowLabel: {
        ...typography.body,
        color: colors.text,
    },
    rowValue: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: "700",
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
