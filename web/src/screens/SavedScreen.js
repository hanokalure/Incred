import { Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";

export default function SavedScreen({ navigation }) {
  return (
    <PageCard>
      <Text style={styles.title}>Saved</Text>
      <Text style={styles.text}>Keep your favorites for offline access.</Text>
      <PrimaryButton label="Saved Places List" onPress={() => navigation.navigate("SavedList")} />
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
});
