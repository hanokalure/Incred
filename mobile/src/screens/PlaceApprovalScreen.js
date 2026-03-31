import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PageCard from "../components/PageCard";
import ScreenHeader from "../components/ScreenHeader";
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

export default function PlaceApprovalScreen({ navigation }) {
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

  return (
    <PageCard>
      <ScreenHeader title="Place Approvals" onBack={() => navigation.goBack()} />
      <ScrollView>
        <Text style={styles.subtitle}>Review and verify community-submitted discovery points.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {pendingPlaces.length === 0 ? <Text style={styles.empty}>No pending submissions right now.</Text> : null}
        {pendingPlaces.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {categoryLabel(item.category)} • District {item.district_id}
            </Text>
            <TextInput
              style={styles.input}
              value={rejectReasonById[item.id] || ""}
              onChangeText={(value) => setRejectReasonById((prev) => ({ ...prev, [item.id]: value }))}
              placeholder="Optional rejection reason"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.actions}>
              <PrimaryButton
                label={status === `approve-${item.id}` ? "Approving..." : "Approve"}
                onPress={() => handleApprove(item.id)}
              />
              <PrimaryButton
                label={status === `reject-${item.id}` ? "Rejecting..." : "Reject"}
                onPress={() => handleReject(item.id)}
                variant="ghost"
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
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
