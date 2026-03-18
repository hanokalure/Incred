import { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import CategoryChip from "../components/CategoryChip";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import { generateItinerary } from "../services/itinerariesApi";
import { fetchDistricts } from "../services/districtsApi";
import SelectField from "../components/SelectField";
import { PLACE_CATEGORY_OPTIONS } from "../constants/placeCategories";
import { useLanguage } from "../context/LanguageContext";

export default function ItineraryScreen({ navigation }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState([]);
  const [days, setDays] = useState("1");
  const [districts, setDistricts] = useState([]);
  const [districtId, setDistrictId] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  const toggle = (c) => {
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  useEffect(() => {
    fetchDistricts()
      .then((data) => setDistricts(data || []))
      .catch(() => setDistricts([]));
  }, []);

  const districtOptions = (districts || []).map((d) => ({ label: d.name, value: d.id }));

  const handleGenerate = async () => {
    setStatus("loading");
    setError("");
    try {
      if (!districtId) {
        setError(t("pickDistrictError"));
        setStatus("idle");
        return;
      }
      const res = await generateItinerary({
        district_id: Number(districtId),
        days: Math.max(1, Number(days) || 1),
        categories: selected.length ? selected : null,
      });
      navigation.navigate("DayPlan", { plan: res?.plan, district_id: districtId });
    } catch (e) {
      setError(e?.message || "Unable to generate itinerary.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <PageCard>
      <Text style={styles.title}>{t("itineraryTitle")}</Text>
      <Text style={styles.text}>{t("itinerarySubtitle")}</Text>

      <SelectField
        label="District"
        placeholder={t("chooseDistrict")}
        value={districtId}
        options={districtOptions}
        onChange={setDistrictId}
      />

      <Text style={styles.label}>{t("howManyDays")}</Text>
      <TextInput value={days} onChangeText={setDays} keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>{t("preferredCategories")}</Text>
      <View style={styles.row}>
        {PLACE_CATEGORY_OPTIONS.map((c) => (
          <CategoryChip
            key={c.value}
            label={c.label}
            selected={selected.includes(c.value)}
            onPress={() => toggle(c.value)}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        label={status === "loading" ? t("generatingPlan") : t("generatePlan")}
        onPress={handleGenerate}
      />
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
  error: {
    color: colors.error || "#C0392B",
    marginBottom: spacing.md,
  },
});
