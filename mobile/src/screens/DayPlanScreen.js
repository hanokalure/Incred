import { View, Text, StyleSheet } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function DayPlanScreen({ navigation }) {
  return (
    <PageCard>
      <ScreenHeader title="AI Generated Day Plan" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.item}>9:00 AM — Temple Visit</Text>
        <Text style={styles.item}>11:00 AM — Local Breakfast</Text>
        <Text style={styles.item}>1:00 PM — Hidden Lake</Text>
        <Text style={styles.item}>4:00 PM — Historical Fort</Text>
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: spacing.md,
  },
  item: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
});
