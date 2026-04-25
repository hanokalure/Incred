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
import ScreenHeader from "../components/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import {
  deletePlace,
  fetchPlaceDetails,
  fetchPlaces,
  updatePlace,
} from "../services/placesApi";
import { uploadPlaceImage, uploadPlaceVideo } from "../services/uploadsApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { fetchDistricts } from "../services/districtsApi";
import { haversineKm } from "../utils/geo";
import { getBrowserLocation } from "../utils/browserLocation";
import { useLanguage } from "../context/LanguageContext";
import { useResponsive } from "../hooks/useResponsive";

function createEmptyForm() {
  return {
    name: "",
    category: "",
    district_id: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    image_urls: [],
    video_urls: [],
    restaurant_details: {
      cuisine: "",
      price_range: "",
      must_try: "",
    },
    stay_details: {
      stay_type: "",
      price_per_night: "",
      amenities: "",
    },
  };
}

export default function ListingsScreen({ navigation }) {
  const role = useSelector((state) => state.auth.role);
  const { t } = useLanguage();
  const { isMobile, isTablet } = useResponsive();
  const [places, setPlaces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDistrictId, setFilterDistrictId] = useState("All");
  const [userLocation, setUserLocation] = useState(null);

  const categoryLabel = (value) => {
    const mapping = {
      restaurant: t("categoryRestaurant"),
      stay: t("categoryStay"),
      generational_shop: t("categoryGenerationalShop"),
      hidden_gem: t("categoryHiddenGem"),
      tourist_place: t("categoryTouristPlace"),
      artisan: t("categoryArtisan"),
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
  }, []);

  useEffect(() => {
    if (role === "admin") return;
    getBrowserLocation()
      .then((coords) => setUserLocation(coords))
      .catch(() => setUserLocation(null));
  }, [role]);

  useEffect(() => {
    loadPlaces();
  }, [filterCategory, filterDistrictId]);

  const categoryOptions = useMemo(
    () => [
      { label: t("all"), value: "All" },
      { label: t("categoryRestaurant"), value: "restaurant" },
      { label: t("categoryGenerationalShop"), value: "generational_shop" },
      { label: t("categoryTouristPlace"), value: "tourist_place" },
      { label: t("categoryHiddenGem"), value: "hidden_gem" },
      { label: t("categoryStay"), value: "stay" },
    ],
    [t]
  );

  const districtOptions = useMemo(() => {
    const opts = [{ label: t("all"), value: "All" }];
    (districts || []).forEach((d) => opts.push({ label: d.name, value: String(d.id) }));
    return opts;
  }, [districts, t]);

  const adminDistrictOptions = useMemo(
    () => (districts || []).map((d) => ({ label: d.name, value: String(d.id) })),
    [districts]
  );

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
    const filtered = !q
      ? places
      : (places || []).filter((p) => {
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      return name.includes(q) || category.includes(q) || desc.includes(q) || addr.includes(q);
    });
    if (!userLocation) return filtered;
    return filtered.map((p) => {
      const km = haversineKm(userLocation, {
        latitude: p.latitude,
        longitude: p.longitude,
      });
      return {
        ...p,
        distance: km === null ? null : Number(km.toFixed(1)),
      };
    });
  }, [places, query, userLocation]);

  const startEdit = async (place) => {
    setStatus(`load-${place.id}`);
    setError("");
    try {
      const detail = await fetchPlaceDetails(place.id);
      setEditingId(place.id);
      setForm({
        name: detail.name || "",
        category: detail.category || "",
        district_id: String(detail.district_id || ""),
        description: detail.description || "",
        address: detail.address || "",
        latitude: detail.latitude === null || detail.latitude === undefined ? "" : String(detail.latitude),
        longitude: detail.longitude === null || detail.longitude === undefined ? "" : String(detail.longitude),
        image_urls: detail.image_urls || [],
        video_urls: detail.video_urls || [],
        restaurant_details: {
          cuisine: detail.restaurant_details?.cuisine || "",
          price_range: detail.restaurant_details?.price_range || "",
          must_try: detail.restaurant_details?.must_try || "",
        },
        stay_details: {
          stay_type: detail.stay_details?.stay_type || "",
          price_per_night:
            detail.stay_details?.price_per_night === null || detail.stay_details?.price_per_night === undefined
              ? ""
              : String(detail.stay_details.price_per_night),
          amenities: detail.stay_details?.amenities?.join(", ") || "",
        },
      });
    } catch (e) {
      setError(e?.message || "Failed to load place details");
    } finally {
      setStatus("idle");
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setStatus("saving");
    setError("");
    try {
      const payload = {
        name: form.name,
        category: form.category,
        district_id: Number(form.district_id) || undefined,
        description: form.description || null,
        address: form.address || null,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
        image_urls: form.image_urls,
        video_urls: form.video_urls,
      };

      if (form.category === "restaurant") {
        payload.restaurant_details = {
          cuisine: form.restaurant_details.cuisine || null,
          price_range: form.restaurant_details.price_range || null,
          must_try: form.restaurant_details.must_try || null,
        };
      }

      if (form.category === "stay") {
        payload.stay_details = {
          stay_type: form.stay_details.stay_type || null,
          price_per_night: form.stay_details.price_per_night === "" ? null : Number(form.stay_details.price_per_night),
          amenities: form.stay_details.amenities
            ? form.stay_details.amenities.split(",").map((item) => item.trim()).filter(Boolean)
            : [],
        };
      }

      await updatePlace(editingId, payload);
      setEditingId(null);
      setForm(createEmptyForm());
      loadPlaces();
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setStatus("idle");
    }
  };

  const handleDelete = async (id) => {
    setStatus(`delete-${id}`);
    setError("");
    try {
      await deletePlace(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(createEmptyForm());
      }
      loadPlaces();
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally {
      setStatus("idle");
    }
  };

  const uploadAdminImage = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    setStatus("upload-image");
    setError("");
    try {
      const result = await uploadPlaceImage(file);
      setForm((current) => ({
        ...current,
        image_urls: [...(current.image_urls || []), result.public_url],
      }));
    } catch (e) {
      setError(e?.message || "Photo upload failed");
    } finally {
      setStatus("idle");
    }
  };

  const uploadAdminVideo = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    setStatus("upload-video");
    setError("");
    try {
      const result = await uploadPlaceVideo(file);
      setForm((current) => ({
        ...current,
        video_urls: [...(current.video_urls || []), result.public_url],
      }));
    } catch (e) {
      setError(e?.message || "Video upload failed");
    } finally {
      setStatus("idle");
    }
  };

  const removeImageAt = (index) => {
    setForm((current) => ({
      ...current,
      image_urls: current.image_urls.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const removeVideoAt = (index) => {
    setForm((current) => ({
      ...current,
      video_urls: current.video_urls.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  return (
    <PageCard>
      <ScreenHeader title={t("listingsTitle")} onBack={() => navigation.goBack()} />
      
      {role === "admin" ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>Manage and update verified places in the discovery database.</Text>
          </View>
          <View style={styles.adminFilters}>
            <Text style={styles.filterTitle}>Manage Places</Text>
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, address, description..."
              placeholderTextColor={colors.textSecondary}
            />
            <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
              <SelectField
                label={t("category")}
                value={filterCategory}
                options={categoryOptions}
                onChange={setFilterCategory}
              />
              <SelectField
                label={t("district")}
                value={filterDistrictId}
                options={districtOptions}
                onChange={setFilterDistrictId}
              />
            </View>
            <View style={styles.filterActions}>
              <PrimaryButton label={t("refresh")} onPress={loadPlaces} variant="ghost" />
              <PrimaryButton
                label={t("clear")}
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
                  <PrimaryButton
                    label={status === `load-${p.id}` ? "Loading..." : "Edit"}
                    onPress={() => startEdit(p)}
                  />
                  <PrimaryButton
                    label={status === `delete-${p.id}` ? "Deleting..." : "Delete"}
                    onPress={() => handleDelete(p.id)}
                    variant="ghost"
                  />
                </View>
                {editingId === p.id ? (
                  <View style={styles.editPanel}>
                    <TextInput
                      style={styles.input}
                      value={form.name}
                      onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
                      placeholder="Name"
                    />
                    <SelectField
                      label="Category"
                      value={form.category}
                      options={categoryOptions.filter((option) => option.value !== "All")}
                      onChange={(value) => setForm((current) => ({ ...current, category: value }))}
                    />
                    <SelectField
                      label="District"
                      value={form.district_id}
                      options={adminDistrictOptions}
                      onChange={(value) => setForm((current) => ({ ...current, district_id: value }))}
                    />
                    <TextInput
                      style={styles.input}
                      value={form.address}
                      onChangeText={(value) => setForm((current) => ({ ...current, address: value }))}
                      placeholder="Address"
                    />
                    <View style={styles.coordsRow}>
                      <TextInput
                        style={[styles.input, styles.halfInput]}
                        value={form.latitude}
                        onChangeText={(value) => setForm((current) => ({ ...current, latitude: value }))}
                        placeholder="Latitude"
                      />
                      <TextInput
                        style={[styles.input, styles.halfInput]}
                        value={form.longitude}
                        onChangeText={(value) => setForm((current) => ({ ...current, longitude: value }))}
                        placeholder="Longitude"
                      />
                    </View>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={form.description}
                      onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
                      placeholder="Description"
                      multiline
                    />

                    {form.category === "restaurant" ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.sectionLabel}>Restaurant Details</Text>
                        <TextInput
                          style={styles.input}
                          value={form.restaurant_details.cuisine}
                          onChangeText={(value) =>
                            setForm((current) => ({
                              ...current,
                              restaurant_details: { ...current.restaurant_details, cuisine: value },
                            }))
                          }
                          placeholder="Cuisine"
                        />
                        <TextInput
                          style={styles.input}
                          value={form.restaurant_details.price_range}
                          onChangeText={(value) =>
                            setForm((current) => ({
                              ...current,
                              restaurant_details: { ...current.restaurant_details, price_range: value },
                            }))
                          }
                          placeholder="Price range"
                        />
                        <TextInput
                          style={styles.input}
                          value={form.restaurant_details.must_try}
                          onChangeText={(value) =>
                            setForm((current) => ({
                              ...current,
                              restaurant_details: { ...current.restaurant_details, must_try: value },
                            }))
                          }
                          placeholder="Must try"
                        />
                      </View>
                    ) : null}

                    {form.category === "stay" ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.sectionLabel}>Stay Details</Text>
                        <TextInput
                          style={styles.input}
                          value={form.stay_details.stay_type}
                          onChangeText={(value) =>
                            setForm((current) => ({
                              ...current,
                              stay_details: { ...current.stay_details, stay_type: value },
                            }))
                          }
                          placeholder="Stay type"
                        />
                        <TextInput
                          style={styles.input}
                          value={form.stay_details.price_per_night}
                          onChangeText={(value) =>
                            setForm((current) => ({
                              ...current,
                              stay_details: { ...current.stay_details, price_per_night: value },
                            }))
                          }
                          placeholder="Price per night"
                        />
                        <TextInput
                          style={styles.input}
                          value={form.stay_details.amenities}
                          onChangeText={(value) =>
                            setForm((current) => ({
                              ...current,
                              stay_details: { ...current.stay_details, amenities: value },
                            }))
                          }
                          placeholder="Amenities, comma separated"
                        />
                      </View>
                    ) : null}

                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Photos</Text>
                      <View style={styles.mediaGrid}>
                        {(form.image_urls || []).map((imageUrl, index) => (
                          <View key={`${imageUrl}-${index}`} style={styles.mediaCard}>
                            <img
                              src={toDisplayImageUrl(imageUrl)}
                              alt={`Place ${index + 1}`}
                              style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12 }}
                            />
                            <PrimaryButton label="Remove" onPress={() => removeImageAt(index)} variant="ghost" />
                          </View>
                        ))}
                      </View>
                      <View style={styles.fileInputWrap}>
                        <input type="file" accept="image/*" onChange={uploadAdminImage} />
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Videos</Text>
                      <View style={styles.mediaGrid}>
                        {(form.video_urls || []).map((videoUrl, index) => (
                          <View key={`${videoUrl}-${index}`} style={styles.mediaCard}>
                            <video
                              src={toDisplayMediaUrl(videoUrl)}
                              controls
                              muted
                              playsInline
                              style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12 }}
                            />
                            <PrimaryButton label="Remove" onPress={() => removeVideoAt(index)} variant="ghost" />
                          </View>
                        ))}
                      </View>
                      <View style={styles.fileInputWrap}>
                        <input type="file" accept="video/*" onChange={uploadAdminVideo} />
                      </View>
                    </View>

                    <View style={styles.adminButtons}>
                      <PrimaryButton
                        label={
                          status === "saving"
                            ? "Saving..."
                            : status === "upload-image"
                              ? "Uploading Photo..."
                              : status === "upload-video"
                                ? "Uploading Video..."
                                : "Save"
                        }
                        onPress={saveEdit}
                      />
                      <PrimaryButton
                        label="Cancel"
                        onPress={() => {
                          setEditingId(null);
                          setForm(createEmptyForm());
                          setError("");
                        }}
                        variant="ghost"
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.userSearchPanel}>
            <View style={styles.searchBarWrap}>
                <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.cleanSearch}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t("discoverSearchPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                />
            </View>
            
            <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
              <View style={[styles.filterItem, isMobile && styles.filterItemMobile]}>
                <SelectField
                  label={t("category")}
                  value={filterCategory}
                  options={categoryOptions}
                  onChange={setFilterCategory}
                />
              </View>
              <View style={[styles.filterItem, isMobile && styles.filterItemMobile]}>
                <SelectField
                  label={t("district")}
                  value={filterDistrictId}
                  options={districtOptions}
                  onChange={setFilterDistrictId}
                />
              </View>
            </View>
            
            <View style={styles.filterActions}>
              <PrimaryButton 
                label={t("refresh")} 
                onPress={loadPlaces} 
                variant="ghost" 
                style={styles.minimalBtn}
              />
              <PrimaryButton
                label={t("clear")}
                onPress={() => {
                  setQuery("");
                  setFilterCategory("All");
                  setFilterDistrictId("All");
                }}
                variant="ghost"
                style={styles.minimalBtn}
              />
            </View>
          </View>
          <View style={[styles.list, !isMobile && styles.listDesktop]}>
            {visibleUserPlaces.map((p) => (
              <View key={p.id} style={!isMobile ? styles.gridCard : null}>
                <PlaceCard
                  name={p.name}
                  category={categoryLabel(p.category)}
                  distance={p.distance}
                  rating={p.avg_rating ?? p.rating}
                  imageUrl={toDisplayImageUrl(p.image_urls?.[0])}
                  videoUrl={toDisplayMediaUrl(p.video_urls?.[0])}
                  onPress={() => navigation.navigate("PlaceDetail", { id: p.id })}
                />
              </View>
            ))}
          </View>
        </>
      )}
    </PageCard>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  list: {
    marginTop: spacing.lg,
  },
  listDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  gridCard: {
    flex: 1,
    minWidth: 300,
    maxWidth: "50%",
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
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cleanSearch: {
    flex: 1,
    padding: spacing.md,
    color: colors.text,
    outlineStyle: "none",
  },
  filterItem: {
    flex: 1,
    minWidth: 160,
  },
  filterItemMobile: {
    minWidth: "100%",
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  filterRowMobile: {
    flexDirection: "column",
  },
  filterActions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  minimalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    flexWrap: "wrap",
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
    minHeight: 100,
  },
  halfInput: {
    flex: 1,
  },
  coordsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  detailSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.h3,
    color: colors.text,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mediaCard: {
    width: 220,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  fileInputWrap: {
    marginTop: spacing.sm,
  },
  error: {
    color: colors.error || "#C0392B",
    marginBottom: spacing.md,
  },
});
