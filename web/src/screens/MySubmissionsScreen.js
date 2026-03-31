import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput } from "react-native";
import PageCard from "../components/PageCard";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
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

export default function MySubmissionsScreen() {
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
      <Text style={styles.title}>My Submissions</Text>
      <Text style={styles.subtitle}>Track approval status and update your pending or rejected places.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Refresh" onPress={load} variant="ghost" />
      <ScrollView style={styles.list}>
        {rows.length === 0 ? <Text style={styles.empty}>No submissions yet.</Text> : null}
        {rows.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={[styles.badge, statusStyle(item.approval_status)]}>{statusLabel(item.approval_status)}</Text>
            </View>
            <Text style={styles.meta}>Category: {item.category}</Text>
            {item.rejection_reason ? <Text style={styles.rejectReason}>Reason: {item.rejection_reason}</Text> : null}
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
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    ...typography.body,
    fontWeight: "700",
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rejectReason: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.xs,
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
