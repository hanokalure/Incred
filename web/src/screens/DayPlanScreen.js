import { Text, StyleSheet, View } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { colors } from "../theme/colors";
import { fetchItineraries } from "../services/itinerariesApi";
import { useEffect, useState } from "react";
import { getPlaceCategoryLabel } from "../constants/placeCategories";

export default function DayPlanScreen({ navigation, route }) {
  const [plan, setPlan] = useState(route?.params?.plan || null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (plan) return;
    fetchItineraries()
      .then((items) => {
        if (items && items.length) {
          setPlan(items[0].plan || null);
        }
      })
      .catch((e) => setError(e?.message || "Unable to load itinerary."));
  }, [plan]);

  const renderPlan = () => {
    if (!plan) {
      return <Text style={styles.item}>No itinerary yet.</Text>;
    }
    return Object.keys(plan).map((day) => (
      <View key={day} style={styles.dayBlock}>
        <Text style={styles.dayTitle}>{day}</Text>
        {(plan[day] || []).map((p) => (
          <View key={p.id || p.name} style={styles.item}>
            <Text style={styles.itemName}>{p.name}</Text>
            {p.category ? <Text style={styles.itemMeta}>{getPlaceCategoryLabel(p.category)}</Text> : null}
            {p.address ? <Text style={styles.itemMeta}>{p.address}</Text> : null}
          </View>
        ))}
      </View>
    ));
  };

  return (
    <PageCard>
      <ScreenHeader title="AI Generated Day Plan" onBack={() => navigation.goBack()} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {renderPlan()}
    </PageCard>
  );
}

const styles = StyleSheet.create({
  item: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  dayBlock: {
    marginBottom: spacing.lg,
  },
  dayTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error || "#C0392B",
    marginBottom: spacing.md,
  },
});
