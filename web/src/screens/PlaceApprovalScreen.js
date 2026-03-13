import { View, Text, StyleSheet, FlatList } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PageCard from "../components/PageCard";
import PrimaryButton from "../components/PrimaryButton";

const PENDING_PLACES = [
    { id: "s1", name: "Malnad Cafe", category: "Food", user: "abhishek_k", date: "2026-03-12" },
    { id: "s2", name: "Agumbe View Point Shop", category: "Local Picks", user: "karnataka_traveler", date: "2026-03-11" },
    { id: "s3", name: "Dharwad Pedha Original", category: "Shops", user: "sweet_tooth", date: "2026-03-10" },
];

export default function PlaceApprovalScreen() {
    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.category} • Submitted by @{item.user}</Text>
            </View>
            <View style={styles.actions}>
                <PrimaryButton
                    label="Approve"
                    onPress={() => { }}
                    style={styles.actionBtn}
                />
                <View style={styles.spacer} />
                <PrimaryButton
                    label="Reject"
                    onPress={() => { }}
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

            <FlatList
                data={PENDING_PLACES}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
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
});
