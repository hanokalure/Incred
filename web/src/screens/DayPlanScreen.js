import { Text, StyleSheet } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { colors } from "../theme/colors";

export default function DayPlanScreen({ navigation }) {
  return (
    <PageCard>
      <ScreenHeader title="AI Generated Day Plan" onBack={() => navigation.goBack()} />
      <Text style={styles.item}>9:00 AM — Temple Visit</Text>
      <Text style={styles.item}>11:00 AM — Local Breakfast</Text>
      <Text style={styles.item}>1:00 PM — Hidden Lake</Text>
      <Text style={styles.item}>4:00 PM — Historical Fort</Text>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  item: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
