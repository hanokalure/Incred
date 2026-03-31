import { useEffect, useMemo, useState } from "react";
import { Text, StyleSheet, ScrollView, View, TextInput } from "react-native";
import { useSelector } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import PlaceCard from "../components/PlaceCard";
import SelectField from "../components/SelectField";
import { deletePlace, fetchPlaces, updatePlace } from "../services/placesApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { fetchDistricts } from "../services/districtsApi";

export default function ListingsScreen({ navigation }) {
  const role = useSelector((state) => state.auth.role);
  const [places, setPlaces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", district_id: "", description: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDistrictId, setFilterDistrictId] = useState("All");

  const categoryLabel = (value) => {
    const mapping = {
      restaurant: "Food",
      stay: "Stay",
      generational_shop: "Shops",
      hidden_gem: "Hidden Gems",
      tourist_place: "Tourist",
    };
    return mapping[value] || value;
  };

  const loadPlaces = () => {
    const params = {};
    if (filterCategory && filterCategory !== "All") params.category = filterCategory;
    if (filterDistrictId && filterDistrictId !== "All") params.district_id = filterDistrictId;

    fetchPlaces(params)
      .then((data) => setPlaces(data || []))
      .catch(() => setPlaces([]));
  };

  useEffect(() => {
    loadPlaces();
    fetchDistricts()
      .then((data) => setDistricts(data || []))
      .catch(() => setDistricts([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (role === "admin") loadPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterDistrictId]);

  const categoryOptions = useMemo(
    () => [
      { label: "All categories", value: "All" },
      { label: "Restaurant", value: "restaurant" },
      { label: "Generational Shop", value: "generational_shop" },
      { label: "Tourist Place", value: "tourist_place" },
      { label: "Hidden Gem", value: "hidden_gem" },
      { label: "Stay", value: "stay" },
    ],
    []
  );

  const districtOptions = useMemo(() => {
    const opts = [{ label: "All districts", value: "All" }];
    (districts || []).forEach((d) => opts.push({ label: d.name, value: String(d.id) }));
    return opts;
  }, [districts]);

  const districtNameById = useMemo(() => {
    const map = new Map();
    (districts || []).forEach((d) => map.set(String(d.id), d.name));
    return map;
  }, [districts]);

  const visibleAdminPlaces = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return places;
    return (places || []).filter((p) => {
      const name = (p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || addr.includes(q);
    });
  }, [places, query]);

  const visibleUserPlaces = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return places;
    return (places || []).filter((p) => {
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      return name.includes(q) || category.includes(q) || desc.includes(q) || addr.includes(q);
    });
  }, [places, query]);

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

  return (
    <PageCard>
      <Text style={styles.title}>Listings</Text>
      <Text style={styles.text}>Browse curated places and businesses.</Text>

      {role === "admin" ? (
        <>
          <View style={styles.adminFilters}>
            <Text style={styles.filterTitle}>Manage Places</Text>
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, address, description…"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.filterRow}>
              <SelectField
                label="Category"
                value={filterCategory}
                options={categoryOptions}
                onChange={setFilterCategory}
              />
              <SelectField
                label="District"
                value={filterDistrictId}
                options={districtOptions}
                onChange={setFilterDistrictId}
              />
            </View>
            <View style={styles.filterActions}>
              <PrimaryButton label="Refresh" onPress={loadPlaces} variant="ghost" />
              <PrimaryButton
                label="Clear"
                onPress={() => {
                  setQuery("");
                  setFilterCategory("All");
                  setFilterDistrictId("All");
                }}
                variant="ghost"
              />
            </View>
          </View>
        <ScrollView style={styles.list}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {visibleAdminPlaces.map((p) => (
            <View key={p.id} style={styles.adminCard}>
              <Text style={styles.adminTitle}>{p.name}</Text>
              <Text style={styles.adminMeta}>
                {categoryLabel(p.category)} • {districtNameById.get(String(p.district_id)) || `District ${p.district_id}`}
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
          ))}
        </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.userSearchPanel}>
            <Text style={styles.filterTitle}>Discover Search</Text>
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by place, category, address..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        <ScrollView style={styles.list}>
          {visibleUserPlaces.map((p) => (
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
        </>
      )}
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
  list: {
    marginTop: spacing.lg,
  },
  adminFilters: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  userSearchPanel: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  filterTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  search: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  filterActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
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
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
  },
  error: {
    color: colors.error || "#C0392B",
    marginBottom: spacing.md,
  },
});
