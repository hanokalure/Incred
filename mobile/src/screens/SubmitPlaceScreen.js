import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function SubmitPlaceScreen({ navigation }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  return (
    <PageCard>
      <ScreenHeader title="Suggest a Place" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.label}>Place name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />
        <Text style={styles.label}>Category</Text>
        <TextInput value={category} onChangeText={setCategory} style={styles.input} />
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
        />
        <Text style={styles.label}>Upload photos</Text>
        <PhotoPlaceholder label="Add photos (coming soon)" />
        <PrimaryButton label="Submit for Approval" onPress={() => navigation.goBack()} />
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: spacing.md,
  },
  label: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.clay,
  },
  textArea: {
    height: 110,
    textAlignVertical: "top",
  },
});
