import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { actOnAdminStoryReport, fetchAdminStoryReports } from "../services/adminApi";

import ScreenHeader from "../components/ScreenHeader";

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

export default function PlaceApprovalScreen({ navigation }) {
    const [pendingPlaces, setPendingPlaces] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [rejectReasonById, setRejectReasonById] = useState({});
    const [pendingPhotoSubmissions, setPendingPhotoSubmissions] = useState([]);
    const [storyReports, setStoryReports] = useState([]);

    const loadPending = useCallback(() => {
        fetchPendingPlaces()
            .then((rows) => setPendingPlaces(rows || []))
            .catch((e) => setError(e?.message || "Failed to load pending places"));
        fetchPendingPlacePhotoSubmissions()
            .then((rows) => setPendingPhotoSubmissions(rows || []))
            .catch((e) => setError(e?.message || "Failed to load pending media submissions"));
        fetchAdminStoryReports()
            .then((rows) => setStoryReports((rows || []).filter((item) => item.status === "open")))
            .catch((e) => setError(e?.message || "Failed to load story reports"));
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

    const handleStoryReportAction = async (reportId, action) => {
        setStatus(`${action}-story-${reportId}`);
        setError("");
        try {
            await actOnAdminStoryReport(reportId, action, rejectReasonById[`story-${reportId}`] || "");
            loadPending();
        } catch (e) {
            setError(e?.message || "Story moderation failed");
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

                {item.image_urls && item.image_urls.length > 0 && (
                    <View style={styles.placePreviewWrap}>
                        <img
                            src={toDisplayImageUrl(item.image_urls[0])}
                            alt={item.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </View>
                )}

                {item.description ? (
                    <Text style={styles.detailsText}><Text style={styles.bold}>Description: </Text>{item.description}</Text>
                ) : null}
                {item.address ? (
                    <Text style={styles.detailsText}><Text style={styles.bold}>Address: </Text>{item.address}</Text>
                ) : null}

                {item.category === "restaurant" && item.restaurant_details && (
                    <Text style={styles.detailsText}>
                        <Text style={styles.bold}>Cuisine:</Text> {item.restaurant_details.cuisine} • <Text style={styles.bold}>Price:</Text> {item.restaurant_details.price_range} • <Text style={styles.bold}>Must Try:</Text> {item.restaurant_details.must_try}
                    </Text>
                )}
                {item.category === "stay" && item.stay_details && (
                    <Text style={styles.detailsText}>
                        <Text style={styles.bold}>Type:</Text> {item.stay_details.stay_type} • <Text style={styles.bold}>Price/Night:</Text> ₹{item.stay_details.price_per_night} • <Text style={styles.bold}>Amenities:</Text> {item.stay_details.amenities?.join(", ")}
                    </Text>
                )}

                <TextInput
                    style={[styles.input, { marginTop: spacing.md }]}
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
            <ScreenHeader title="Approvals Hub" onBack={() => navigation.goBack()} />
            
            <View style={styles.header}>
                <Text style={styles.title}>Place Requests</Text>
                <Text style={styles.subtitle}>Review new discovery points submitted by the community.</Text>
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

            <View style={styles.sectionHeader}>
                <Text style={styles.title}>Media Submissions</Text>
            </View>
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

            <View style={styles.sectionHeader}>
                <Text style={styles.title}>Moderation Queue</Text>
            </View>
                {storyReports.length === 0 ? (
                    <Text style={styles.empty}>No open story reports right now.</Text>
                ) : null}
                {storyReports.map((item) => (
                    <View key={item.id} style={styles.photoCard}>
                        <Text style={styles.itemName}>{item.story?.user_name || "Story author"}</Text>
                        <Text style={styles.itemMeta}>
                            Reported by {item.reported_by_name || "Member"} • Reason: {item.reason}
                        </Text>
                        <View style={styles.previewWrap}>
                            {item.story?.media_type === "video" ? (
                                <video
                                    src={toDisplayMediaUrl(item.story?.media_url)}
                                    controls
                                    playsInline
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <img
                                    src={toDisplayMediaUrl(item.story?.media_url)}
                                    alt={item.story?.caption || "Reported story"}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            )}
                        </View>
                        <Text style={styles.reportCaption}>{item.story?.caption || "No caption"}</Text>
                        <Text style={styles.reportStats}>
                            Views: {item.story?.view_count ?? 0} • Status: {item.story?.status || "unknown"}
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={rejectReasonById[`story-${item.id}`] || ""}
                            onChangeText={(value) =>
                                setRejectReasonById((prev) => ({ ...prev, [`story-${item.id}`]: value }))
                            }
                            placeholder="Optional admin note"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={styles.actions}>
                            <PrimaryButton
                                label={status === `dismiss-story-${item.id}` ? "Dismissing..." : "Dismiss Report"}
                                onPress={() => handleStoryReportAction(item.id, "dismiss")}
                                variant="ghost"
                                style={styles.actionBtn}
                            />
                            <View style={styles.spacer} />
                            <PrimaryButton
                                label={status === `remove_story-story-${item.id}` ? "Removing..." : "Remove Story"}
                                onPress={() => handleStoryReportAction(item.id, "remove_story")}
                                style={styles.actionBtn}
                            />
                        </View>
                    </View>
                ))}
        </PageCard>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        marginTop: spacing.xxl,
        marginBottom: spacing.md,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    title: {
        ...typography.h2,
        color: colors.text,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 4,
    },
    list: {
        paddingVertical: spacing.md,
    },
    item: {
        flexDirection: "column",
        alignItems: "stretch",

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
    detailsText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
        lineHeight: 20,
    },
    bold: {
        fontWeight: "700",
        color: colors.text,
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
        justifyContent: "flex-end",
        marginTop: spacing.md,
    },
    actionBtn: {
        minWidth: 120,
    },
    spacer: {
        width: spacing.md,
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
    placePreviewWrap: {
        width: "100%",
        maxWidth: 400,
        height: 200,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        marginVertical: spacing.sm,
    },
    reportCaption: {
        ...typography.body,
        color: colors.text,
        fontWeight: "700",
        marginBottom: spacing.xs,
    },
    reportStats: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
});
