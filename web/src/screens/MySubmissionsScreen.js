import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from "react-native";
import PageCard from "../components/PageCard";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { fetchMySubmissions, resubmitMySubmission, updateMySubmission } from "../services/placesApi";

function statusLabel(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function statusStyle(status) {
  if (status === "approved") return { color: colors.success };
  if (status === "rejected") return { color: colors.error };
  return { color: colors.warning || "#B7791F" };
}

function statusIcon(status) {
  if (status === "approved") return "checkmark-circle";
  if (status === "rejected") return "close-circle";
  return "time";
}

export default function MySubmissionsScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", address: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetchMySubmissions()
      .then((data) => setRows(data || []))
      .catch((e) => setError(e?.message || "Unable to load submissions"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      address: item.address || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setStatus(`save-${editingId}`);
    setError("");
    try {
      await updateMySubmission(editingId, {
        name: form.name,
        description: form.description,
        address: form.address,
      });
      setEditingId(null);
      load();
    } catch (e) {
      setError(e?.message || "Failed to save changes");
    } finally {
      setStatus("idle");
    }
  };

  const handleResubmit = async (id) => {
    setStatus(`resubmit-${id}`);
    setError("");
    try {
      await resubmitMySubmission(id);
      load();
    } catch (e) {
      setError(e?.message || "Resubmit failed");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <PageCard>
      <ScreenHeader title="My Submissions" onBack={() => navigation.goBack()} />
      
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Your Contributions</Text>
            <TouchableOpacity onPress={load} style={styles.refreshIcon}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Track approval status and update your submitted discovery points.</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView style={styles.list}>
        {rows.length === 0 ? <Text style={styles.empty}>No submissions yet.</Text> : null}
        {rows.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle(item.approval_status).color + "15" }]}>
                <Ionicons name={statusIcon(item.approval_status)} size={14} color={statusStyle(item.approval_status).color} />
                <Text style={[styles.badge, statusStyle(item.approval_status)]}>{statusLabel(item.approval_status)}</Text>
              </View>
            </View>
            
            <View style={styles.itemBody}>
                <Text style={styles.meta}>Category: <Text style={styles.metaValue}>{item.category}</Text></Text>
                {item.rejection_reason ? (
                    <View style={styles.rejectBox}>
                        <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                        <Text style={styles.rejectReason}>{item.rejection_reason}</Text>
                    </View>
                ) : null}
            </View>
            {(item.approval_status === "pending" || item.approval_status === "rejected") ? (
              <View style={styles.actions}>
                <PrimaryButton label="Edit" onPress={() => startEdit(item)} variant="ghost" />
                {item.approval_status === "rejected" ? (
                  <PrimaryButton
                    label={status === `resubmit-${item.id}` ? "Resubmitting..." : "Resubmit"}
                    onPress={() => handleResubmit(item.id)}
                  />
                ) : null}
              </View>
            ) : null}
            {editingId === item.id ? (
              <View style={styles.editPanel}>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(v) => setForm({ ...form, name: v })}
                  placeholder="Place name"
                />
                <TextInput
                  style={styles.input}
                  value={form.address}
                  onChangeText={(v) => setForm({ ...form, address: v })}
                  placeholder="Address"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(v) => setForm({ ...form, description: v })}
                  placeholder="Description"
                  multiline
                />
                <PrimaryButton
                  label={status === `save-${item.id}` ? "Saving..." : "Save Changes"}
                  onPress={saveEdit}
                />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  list: {
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.03)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  badge: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemBody: {
    gap: spacing.xs,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  metaValue: {
    color: colors.text,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  rejectBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.error + "10",
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  rejectReason: {
    fontSize: 12,
    color: colors.error,
    fontWeight: "600",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editPanel: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
