import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function SelectField({
  label,
  placeholder = "Select",
  value,
  options,
  onChange,
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const match = (options || []).find((o) => String(o.value) === String(value));
    return match ? match.label : "";
  }, [options, value]);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={selectedLabel ? styles.valueText : styles.placeholderText}>
          {selectedLabel || placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label || "Select"}</Text>
            <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.list}>
            {(options || []).map((o) => (
              <Pressable
                key={String(o.value)}
                onPress={() => {
                  onChange?.(o.value);
                  setOpen(false);
                }}
                style={[styles.item, String(o.value) === String(value) && styles.itemActive]}
              >
                <Text style={styles.itemText}>{o.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  valueText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  chevron: {
    color: colors.textSecondary,
    fontWeight: "900",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.55)",
  },
  modalCard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 96,
    bottom: 96,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    boxShadow: "0px 18px 40px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.elevated,
  },
  closeText: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "800",
    color: colors.textSecondary,
    marginTop: -2,
  },
  list: {
    padding: spacing.md,
  },
  item: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  itemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  itemText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
});

