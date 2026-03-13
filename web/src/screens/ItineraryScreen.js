import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import CategoryChip from "../components/CategoryChip";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";

export default function ItineraryScreen({ navigation }) {
  const categories = useSelector((state) => state.places.categories);
  const [selected, setSelected] = useState([]);
  const [hours, setHours] = useState("6");
  const [distance, setDistance] = useState("25");

  const toggle = (c) => {
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  return (
    <PageCard>
      <Text style={styles.title}>AI Itinerary</Text>
      <Text style={styles.text}>Choose preferences to generate your day plan.</Text>

      <Text style={styles.label}>Available hours</Text>
      <TextInput value={hours} onChangeText={setHours} keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>Max distance (km)</Text>
      <TextInput value={distance} onChangeText={setDistance} keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>Preferred categories</Text>
      <View style={styles.row}>
        {categories.map((c) => (
          <CategoryChip key={c} label={c} selected={selected.includes(c)} onPress={() => toggle(c)} />
        ))}
      </View>

      <PrimaryButton label="Generate Day Plan" onPress={() => navigation.navigate("DayPlan")} />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
});
