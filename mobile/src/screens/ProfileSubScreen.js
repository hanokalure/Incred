import { View, Text, StyleSheet, Switch } from "react-native";
import { useState } from "react";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import ScreenHeader from "../components/ScreenHeader";
import PageCard from "../components/PageCard";

export default function ProfileSubScreen({ navigation, route }) {
  const title = route?.params?.title || "Details";
  const [enabled, setEnabled] = useState(true);

  const renderBody = () => {
    if (title === "Achievements") {
      return (
        <View>
          <Text style={styles.item}>Explorer — 12 places visited</Text>
          <Text style={styles.item}>Foodie — 5 reviews posted</Text>
          <Text style={styles.item}>Local Hero — 2 places submitted</Text>
        </View>
      );
    }
    if (title === "Reviews") {
      return (
        <View>
          <Text style={styles.item}>You have posted 4 reviews.</Text>
          <Text style={styles.item}>Average rating: 4.5</Text>
        </View>
      );
    }
    if (title === "Language") {
      return (
        <View>
          <Text style={styles.item}>English</Text>
          <Text style={styles.item}>Kannada (coming soon)</Text>
        </View>
      );
    }
    if (title === "Notifications") {
      return (
        <View style={styles.row}>
          <Text style={styles.item}>Push Notifications</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>
      );
    }
    return <Text style={styles.item}>Content for {title} goes here.</Text>;
  };

  return (
    <PageCard>
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {renderBody()}
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
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
