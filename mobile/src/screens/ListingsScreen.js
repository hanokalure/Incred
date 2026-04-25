import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import PlaceCard from "../components/PlaceCard";
import { deletePlace, fetchPlaces, updatePlace } from "../services/placesApi";
import { getAuthProfile } from "../services/authStore";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { attachDistanceToPlaces, requestCurrentLocation } from "../services/locationHelpers";

export default function ListingsScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [role, setRole] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", district_id: "", description: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  const categoryLabel = (value) => {
    const mapping = {
      restaurant: "Food",
      stay: "Stay",
      generational_shop: "Shops",
      hidden_gem: "Hidden Gems",
      tourist_place: "Tourist",
      artisan: "Artisan",
    };
    return mapping[value] || value;
  };

  const loadPlaces = () => {
    fetchPlaces()
      .then((data) => setPlaces(data || []))
      .catch(() => setPlaces([]));
  };

  useEffect(() => {
    loadPlaces();
    getAuthProfile()
      .then((profile) => setRole(profile?.role || "user"))
      .catch(() => setRole("user"));
  }, []);

  useEffect(() => {
    if (role === "admin") return;
    requestCurrentLocation().then(setUserLocation);
  }, [role]);

  const startEdit = (place) => {
    setEditingId(place.id);
    setForm({
      name: place.name || "",
      category: place.category || "",
      district_id: String(place.district_id || ""),
      description: place.description || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setStatus("saving");
    setError("");
    try {
      await updatePlace(editingId, {
        name: form.name,
        category: form.category,
        district_id: Number(form.district_id) || undefined,
        description: form.description,
      });
      setEditingId(null);
      loadPlaces();
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setStatus("idle");
    }
  };

  const handleDelete = async (id) => {
    setStatus("deleting");
    setError("");
    try {
      await deletePlace(id);
      loadPlaces();
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally {
      setStatus("idle");
    }
  };

  const visibleUserPlaces = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const filtered = !q
      ? places
      : (places || []).filter((p) => {
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      return name.includes(q) || category.includes(q) || desc.includes(q) || addr.includes(q);
    });
    return attachDistanceToPlaces(filtered, userLocation);
  }, [places, query, userLocation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Listings / Discover</Text>
      <Text style={styles.text}>Browse curated places and businesses.</Text>
      {role === "admin" ? (
        <PrimaryButton label="Search & Filter" onPress={() => navigation.navigate("SearchFilter")} />
      ) : (
        <View style={styles.searchPanel}>
          <Text style={styles.searchTitle}>Discover Search</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by place, category, address..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}
      <ScrollView style={styles.list}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {role === "admin"
          ? places.map((p) => (
              <View key={p.id} style={styles.adminCard}>
                <Text style={styles.adminTitle}>{p.name}</Text>
                <Text style={styles.adminMeta}>
                  {categoryLabel(p.category)} • District {p.district_id}
                </Text>
                <View style={styles.adminButtons}>
                  <PrimaryButton label="Edit" onPress={() => startEdit(p)} />
                  <PrimaryButton label="Delete" onPress={() => handleDelete(p.id)} variant="ghost" />
                </View>
                {editingId === p.id ? (
                  <View style={styles.editPanel}>
                    <TextInput
                      style={styles.input}
                      value={form.name}
                      onChangeText={(v) => setForm({ ...form, name: v })}
                      placeholder="Name"
                    />
                    <TextInput
                      style={styles.input}
                      value={form.category}
                      onChangeText={(v) => setForm({ ...form, category: v })}
                      placeholder="Category (restaurant, stay, etc)"
                    />
                    <TextInput
                      style={styles.input}
                      value={form.district_id}
                      onChangeText={(v) => setForm({ ...form, district_id: v })}
                      placeholder="District ID"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={form.description}
                      onChangeText={(v) => setForm({ ...form, description: v })}
                      placeholder="Description"
                      multiline
                    />
                    <PrimaryButton
                      label={status === "saving" ? "Saving..." : "Save"}
                      onPress={saveEdit}
                    />
                  </View>
                ) : null}
              </View>
            ))
          : visibleUserPlaces.map((p) => (
              <PlaceCard
                key={p.id}
                name={p.name}
                category={categoryLabel(p.category)}
                distance={p.distance}
                rating={p.avg_rating ?? p.rating}
                imageUrl={toDisplayImageUrl(p.image_urls?.[0])}
                videoUrl={toDisplayMediaUrl(p.video_urls?.[0])}
                onPress={() => navigation.navigate("PlaceDetail", { id: p.id })}
              />
            ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
    padding: spacing.lg,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  list: {
    marginTop: spacing.lg,
  },
  searchPanel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.text,
  },
  adminCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  adminTitle: {
    ...typography.h3,
    color: colors.text,
  },
  adminMeta: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  adminButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  editPanel: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.md,
  },
});
