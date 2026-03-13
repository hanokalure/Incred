import { Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";

export default function ListingsScreen({ navigation }) {
  return (
    <PageCard>
      <Text style={styles.title}>Listings</Text>
      <Text style={styles.text}>Browse curated places and businesses.</Text>
      <PrimaryButton label="Search & Filter" onPress={() => navigation.navigate("SearchFilter")} />
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
