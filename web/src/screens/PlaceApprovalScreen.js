import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PageCard from "../components/PageCard";
import PrimaryButton from "../components/PrimaryButton";
import { approvePlace, fetchPendingPlaces, rejectPlace } from "../services/placesApi";

const categoryLabel = (value) => {
    const mapping = {
        restaurant: "Food",
        stay: "Stay",
        generational_shop: "Shops",
        hidden_gem: "Hidden Gems",
        tourist_place: "Tourist",
    };
    return mapping[value] || value;
};

export default function PlaceApprovalScreen() {
    const [pendingPlaces, setPendingPlaces] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [rejectReasonById, setRejectReasonById] = useState({});

    const loadPending = useCallback(() => {
        fetchPendingPlaces()
            .then((rows) => setPendingPlaces(rows || []))
            .catch((e) => setError(e?.message || "Failed to load pending places"));
    }, []);

    useEffect(() => {
        loadPending();
    }, [loadPending]);

    const handleApprove = async (id) => {
        setStatus(`approve-${id}`);
        setError("");
        try {
            await approvePlace(id);
            loadPending();
        } catch (e) {
            setError(e?.message || "Approval failed");
        } finally {
            setStatus("idle");
        }
    };

    const handleReject = async (id) => {
        setStatus(`reject-${id}`);
        setError("");
        try {
            await rejectPlace(id, rejectReasonById[id] || "");
            loadPending();
        } catch (e) {
            setError(e?.message || "Rejection failed");
        } finally {
            setStatus("idle");
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                    {categoryLabel(item.category)} • District {item.district_id}
                </Text>
                <TextInput
                    style={styles.input}
                    value={rejectReasonById[item.id] || ""}
                    onChangeText={(value) =>
                        setRejectReasonById((prev) => ({ ...prev, [item.id]: value }))
                    }
                    placeholder="Optional rejection reason"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>
            <View style={styles.actions}>
                <PrimaryButton
                    label={status === `approve-${item.id}` ? "Approving..." : "Approve"}
                    onPress={() => handleApprove(item.id)}
                    style={styles.actionBtn}
                />
                <View style={styles.spacer} />
                <PrimaryButton
                    label={status === `reject-${item.id}` ? "Rejecting..." : "Reject"}
                    onPress={() => handleReject(item.id)}
                    variant="ghost"
                    style={styles.actionBtn}
                />
            </View>
        </View>
    );

    return (
        <PageCard>
            <View style={styles.header}>
                <Text style={styles.title}>Place Approvals</Text>
                <Text style={styles.subtitle}>Review and verify community-submitted discovery points.</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {pendingPlaces.length === 0 ? (
                <Text style={styles.empty}>No pending submissions right now.</Text>
            ) : null}

            <FlatList
                data={pendingPlaces}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.list}
            />
        </PageCard>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.h1,
    },
    subtitle: {
        ...typography.body,
        marginTop: spacing.xs,
    },
    list: {
        paddingVertical: spacing.md,
    },
    item: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.lg,
    },
    itemName: {
        ...typography.h3,
    },
    itemMeta: {
        ...typography.body,
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minWidth: 220,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
    },
    actionBtn: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    spacer: {
        width: spacing.sm,
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
    },
    error: {
        ...typography.body,
        color: colors.error,
        marginBottom: spacing.md,
    },
    empty: {
        ...typography.body,
        color: colors.textSecondary,
    },
});
