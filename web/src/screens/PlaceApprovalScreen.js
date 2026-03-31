import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PageCard from "../components/PageCard";
import PrimaryButton from "../components/PrimaryButton";
import {
    approvePlace,
    approvePlacePhotoSubmission,
    fetchPendingPlacePhotoSubmissions,
    fetchPendingPlaces,
    rejectPlace,
    rejectPlacePhotoSubmission,
} from "../services/placesApi";
import { toDisplayImageUrl } from "../services/mediaUrl";

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
    const [pendingPhotoSubmissions, setPendingPhotoSubmissions] = useState([]);

    const loadPending = useCallback(() => {
        fetchPendingPlaces()
            .then((rows) => setPendingPlaces(rows || []))
            .catch((e) => setError(e?.message || "Failed to load pending places"));
        fetchPendingPlacePhotoSubmissions()
            .then((rows) => setPendingPhotoSubmissions(rows || []))
            .catch((e) => setError(e?.message || "Failed to load pending media submissions"));
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

    const handlePhotoApprove = async (id) => {
        setStatus(`approve-photo-${id}`);
        setError("");
        try {
            await approvePlacePhotoSubmission(id);
            loadPending();
        } catch (e) {
            setError(e?.message || "Media approval failed");
        } finally {
            setStatus("idle");
        }
    };

    const handlePhotoReject = async (id) => {
        setStatus(`reject-photo-${id}`);
        setError("");
        try {
            await rejectPlacePhotoSubmission(id, rejectReasonById[`photo-${id}`] || "");
            loadPending();
        } catch (e) {
            setError(e?.message || "Media rejection failed");
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

            <View style={styles.photoSection}>
                <Text style={styles.title}>Media Approvals</Text>
                <Text style={styles.subtitle}>Review photo and video additions submitted by members for approved places.</Text>
                {pendingPhotoSubmissions.length === 0 ? (
                    <Text style={styles.empty}>No pending media submissions right now.</Text>
                ) : null}
                {pendingPhotoSubmissions.map((item) => (
                    <View key={item.id} style={styles.photoCard}>
                        <Text style={styles.itemName}>{item.place_name || `Place ${item.place_id}`}</Text>
                        <Text style={styles.itemMeta}>
                            Submitted by {item.submitted_by_name || "Member"}
                        </Text>
                        <View style={styles.previewWrap}>
                            {item.media_type === "video" ? (
                                <video
                                    src={toDisplayImageUrl(item.video_url || item.media_url)}
                                    controls
                                    playsInline
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <img
                                    src={toDisplayImageUrl(item.image_url || item.media_url)}
                                    alt={item.place_name || "Pending place media"}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            )}
                        </View>
                        <TextInput
                            style={styles.input}
                            value={rejectReasonById[`photo-${item.id}`] || ""}
                            onChangeText={(value) =>
                                setRejectReasonById((prev) => ({ ...prev, [`photo-${item.id}`]: value }))
                            }
                            placeholder="Optional rejection reason"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={styles.actions}>
                            <PrimaryButton
                                label={status === `approve-photo-${item.id}` ? "Approving..." : "Approve Media"}
                                onPress={() => handlePhotoApprove(item.id)}
                                style={styles.actionBtn}
                            />
                            <View style={styles.spacer} />
                            <PrimaryButton
                                label={status === `reject-photo-${item.id}` ? "Rejecting..." : "Reject Media"}
                                onPress={() => handlePhotoReject(item.id)}
                                variant="ghost"
                                style={styles.actionBtn}
                            />
                        </View>
                    </View>
                ))}
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
    photoSection: {
        marginTop: spacing.xl,
    },
    photoCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        marginTop: spacing.md,
    },
    previewWrap: {
        width: "100%",
        height: 220,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
});
