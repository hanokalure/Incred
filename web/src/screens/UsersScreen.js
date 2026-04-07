import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchAdminUsers } from "../services/adminApi";
import { toDisplayMediaUrl } from "../services/mediaUrl";

export default function UsersScreen({ navigation }) {
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
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Users With Stories</Text>
                        <Text style={styles.summaryValue}>{summary.users_with_active_stories ?? "—"}</Text>
                    </View>
                </View>

                {users.length === 0 && !error ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No users found in the database yet.</Text>
                    </View>
                ) : (
                    users.map((user) => (
                        <Pressable
                            key={user.id}
                            style={styles.userCard}
                            onPress={() => navigation.navigate("UserDetail", { user })}
                        >
                            <View style={styles.userTopRow}>
                                <View style={styles.userTextWrap}>
                                    <Text style={styles.userName}>{user.name || "Unnamed user"}</Text>
                                    <Text style={styles.userMeta}>{user.email}</Text>
                                    <Text style={styles.userRole}>{String(user.role || "user").toUpperCase()}</Text>
                                    <Text style={styles.storyMeta}>
                                        {user.active_story_count ? `${user.active_story_count} active stor${user.active_story_count === 1 ? "y" : "ies"}` : "No active stories"}
                                    </Text>
                                </View>
                                {user.latest_story ? (
                                    <View style={styles.storyPreviewWrap}>
                                        <Image
                                            source={{ uri: toDisplayMediaUrl(user.latest_story.media_url) }}
                                            style={styles.storyPreview}
                                            resizeMode="cover"
                                        />
                                        {user.latest_story.media_type === "video" ? (
                                            <View style={styles.videoBadge}>
                                                <Text style={styles.videoBadgeText}>VIDEO</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                ) : null}
                            </View>
                            {user.active_story_count ? (
                                <Pressable
                                    style={styles.storyAction}
                                    onPress={(event) => {
                                        event?.stopPropagation?.();
                                        navigation.navigate("StoryViewer", {
                                            stories: user.active_stories || [],
                                            userName: user.name || user.email || "User Story",
                                            initialIndex: 0,
                                        });
                                    }}
                                >
                                    <Text style={styles.storyActionText}>View Story</Text>
                                </Pressable>
                            ) : null}
                        </Pressable>
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
    userTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing.md,
    },
    userTextWrap: {
        flex: 1,
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
    storyMeta: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    storyPreviewWrap: {
        width: 84,
        height: 84,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.accent,
    },
    storyPreview: {
        width: "100%",
        height: "100%",
    },
    videoBadge: {
        position: "absolute",
        right: 6,
        bottom: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(17,17,17,0.68)",
    },
    videoBadgeText: {
        fontSize: 10,
        fontWeight: "800",
        color: "#fff",
    },
    storyAction: {
        alignSelf: "flex-start",
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 999,
        backgroundColor: colors.accent,
        borderWidth: 1,
        borderColor: colors.border,
    },
    storyActionText: {
        ...typography.body,
        color: colors.text,
        fontWeight: "700",
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
