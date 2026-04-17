import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../components/ScreenHeader";
import CategoryChip from "../components/CategoryChip";
import PlaceCard from "../components/PlaceCard";
import PageCard from "../components/PageCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaces } from "../services/placesApi";
import { fetchDistricts } from "../services/districtsApi";
import { attachDistanceToPlaces, requestCurrentLocation } from "../services/locationHelpers";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";

export default function SearchFilterScreen({ navigation, route }) {
  const [places, setPlaces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showOnlyTopRated, setShowOnlyTopRated] = useState(false);
  const [showOnlyWithMedia, setShowOnlyWithMedia] = useState(false);
  const [showOnlyNearMe, setShowOnlyNearMe] = useState(false);

  const CATEGORY_OPTIONS = [
    { label: "All", value: null },
    { label: "Food", value: "restaurant" },
    { label: "Stay", value: "stay" },
    { label: "Shops", value: "generational_shop" },
    { label: "Hidden Gems", value: "hidden_gem" },
    { label: "Tourist", value: "tourist_place" },
  ];

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

  const districtOptions = useMemo(
    () => [{ id: null, name: "All Districts" }, ...(districts || [])],
    [districts]
  );

  const SORT_OPTIONS = [
    { label: "Recommended", value: "recommended" },
    { label: "Nearest", value: "nearest" },
    { label: "Top Rated", value: "rating" },
    { label: "Newest", value: "newest" },
  ];

  useEffect(() => {
    fetchDistricts()
      .then((data) => setDistricts(data || []))
      .catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    const initialCategory = route?.params?.category;
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory || null);
    }
  }, [route?.params?.category]);

  useEffect(() => {
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (selectedDistrict) params.district_id = selectedDistrict;
    fetchPlaces(params)
      .then((data) => setPlaces(data || []))
      .catch(() => setPlaces([]));
  }, [selectedCategory, selectedDistrict]);

  useEffect(() => {
    requestCurrentLocation().then(setUserLocation);
  }, []);

  const visiblePlaces = useMemo(() => {
    const withDistance = attachDistanceToPlaces(places, userLocation);
    const normalizedQuery = query.trim().toLowerCase();

    const searched = normalizedQuery
      ? withDistance.filter((place) => {
          const haystack = [
            place.name,
            place.category,
            place.description,
            place.address,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        })
      : withDistance;

    const filtered = searched.filter((place) => {
      if (showOnlyTopRated && Number(place.avg_rating ?? place.rating ?? 0) < 4.5) return false;
      if (showOnlyWithMedia && !(place.image_urls?.length || place.video_urls?.length)) return false;
      if (showOnlyNearMe && (place.distance === null || place.distance === undefined || place.distance > 15)) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sortBy === "nearest") {
      sorted.sort((a, b) => {
        const aDistance = a.distance ?? Number.MAX_SAFE_INTEGER;
        const bDistance = b.distance ?? Number.MAX_SAFE_INTEGER;
        return aDistance - bDistance;
      });
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => Number(b.avg_rating ?? b.rating ?? 0) - Number(a.avg_rating ?? a.rating ?? 0));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
    }

    return sorted;
  }, [places, userLocation, query, sortBy, showOnlyTopRated, showOnlyWithMedia, showOnlyNearMe]);

  const activeFilterCount = [
    selectedCategory,
    selectedDistrict,
    showOnlyTopRated ? "topRated" : null,
    showOnlyWithMedia ? "withMedia" : null,
    showOnlyNearMe ? "nearMe" : null,
  ].filter(Boolean).length;

  const categorySelectionLabel = selectedCategory ? CATEGORY_OPTIONS.find((item) => item.value === selectedCategory)?.label || "1 selected" : "All";
  const districtSelectionLabel = selectedDistrict
    ? districtOptions.find((item) => item.id === selectedDistrict)?.name || "1 selected"
    : "All districts";
  const quickFilterCount = [showOnlyTopRated, showOnlyWithMedia, showOnlyNearMe].filter(Boolean).length;
  const filterSummary = [
    selectedCategory ? categorySelectionLabel : null,
    selectedDistrict ? districtSelectionLabel : null,
    showOnlyTopRated ? "Highly rated" : null,
    showOnlyWithMedia ? "Has media" : null,
    showOnlyNearMe ? "Near me" : null,
  ].filter(Boolean);

  const resetAllFilters = () => {
    setSelectedCategory(null);
    setSelectedDistrict(null);
    setShowOnlyTopRated(false);
    setShowOnlyWithMedia(false);
    setShowOnlyNearMe(false);
  };

  return (
    <PageCard>
      <ScreenHeader title="Discover" onBack={() => navigation.goBack()} />
      <Text style={styles.helper}>Find the best local spots and hidden gems across Karnataka.</Text>

      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search places, cuisine, address..."
          placeholderTextColor={colors.textMuted}
        />
        {query ? (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textMuted}
            onPress={() => setQuery("")}
          />
        ) : null}
      </View>

      <View style={styles.resultsHeader}>
        <View>
          <Text style={styles.resultsCount}>{visiblePlaces.length} places</Text>
          <Text style={styles.resultsMeta}>
            {activeFilterCount ? `${activeFilterCount} filters active` : "All Karnataka"}
          </Text>
        </View>
        <Pressable style={styles.filterButton} onPress={() => setFilterOpen(true)}>
          <Ionicons name="options-outline" size={16} color={colors.text} />
          <Text style={styles.filterButtonText}>
            {activeFilterCount ? `Filters (${activeFilterCount})` : "Filters"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.controlLabel}>Sort by</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {SORT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setSortBy(option.value)}
            style={[styles.sortChip, sortBy === option.value && styles.sortChipActive]}
          >
            <Text style={[styles.sortChipText, sortBy === option.value && styles.sortChipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {visiblePlaces.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>No places match this search right now.</Text>
        </View>
      ) : (
        visiblePlaces.map((p) => (
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
        ))
      )}

      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.fallbackBackdrop} onPress={() => setFilterOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>Discover filters</Text>
                <Text style={styles.sheetTitle}>Refine your results</Text>
                <Text style={styles.sheetSubtitle}>Choose a category, district, or quick filter to narrow the list.</Text>
              </View>
              <Pressable style={styles.sheetClose} onPress={() => setFilterOpen(false)}>
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.resultsPreview}>
              <View>
                <Text style={styles.resultsPreviewCount}>{visiblePlaces.length} matches</Text>
                <Text style={styles.resultsPreviewMeta}>
                  {activeFilterCount ? `${activeFilterCount} filters active` : "No filters applied"}
                </Text>
              </View>
              {filterSummary.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.summaryRow}
                >
                  {filterSummary.map((item) => (
                    <View key={item} style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>{item}</Text>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sheetSectionHeader}>
                  <Text style={styles.controlLabel}>Quick filters</Text>
                  <Text style={styles.sheetSectionMeta}>{quickFilterCount || "None"}</Text>
                </View>
                <Text style={styles.sectionHint}>Fast ways to surface stronger picks nearby.</Text>
                <View style={styles.sheetRow}>
                  <Pressable
                    style={[styles.toggleChip, showOnlyTopRated && styles.toggleChipActive]}
                    onPress={() => setShowOnlyTopRated((value) => !value)}
                  >
                    <Ionicons name="star-outline" size={16} color={showOnlyTopRated ? colors.text : colors.textSecondary} />
                    <Text style={[styles.toggleChipText, showOnlyTopRated && styles.toggleChipTextActive]}>Highly rated</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.toggleChip, showOnlyWithMedia && styles.toggleChipActive]}
                    onPress={() => setShowOnlyWithMedia((value) => !value)}
                  >
                    <Ionicons name="images-outline" size={16} color={showOnlyWithMedia ? colors.text : colors.textSecondary} />
                    <Text style={[styles.toggleChipText, showOnlyWithMedia && styles.toggleChipTextActive]}>Has media</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.toggleChip, showOnlyNearMe && styles.toggleChipActive]}
                    onPress={() => setShowOnlyNearMe((value) => !value)}
                  >
                    <Ionicons name="navigate-outline" size={16} color={showOnlyNearMe ? colors.text : colors.textSecondary} />
                    <Text style={[styles.toggleChipText, showOnlyNearMe && styles.toggleChipTextActive]}>Near me</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sheetSectionHeader}>
                  <Text style={styles.controlLabel}>Category</Text>
                  <Text style={styles.sheetSectionMeta}>{categorySelectionLabel}</Text>
                </View>
                <Text style={styles.sectionHint}>Pick one lens for the kind of place you want.</Text>
                <View style={styles.sheetRow}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <CategoryChip
                      key={c.label}
                      label={c.label}
                      selected={selectedCategory === c.value || (c.value === null && selectedCategory === null)}
                      onPress={() => setSelectedCategory(c.value)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sheetSectionHeader}>
                  <Text style={styles.controlLabel}>District</Text>
                  <Text style={styles.sheetSectionMeta}>{districtSelectionLabel}</Text>
                </View>
                <Text style={styles.sectionHint}>Limit results to a part of Karnataka when you already know the area.</Text>
                <View style={styles.sheetRow}>
                  {districtOptions.map((d) => (
                    <CategoryChip
                      key={d.id ?? "all"}
                      label={d.name}
                      selected={selectedDistrict === d.id || (d.id === null && selectedDistrict === null)}
                      onPress={() => setSelectedDistrict(d.id)}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <Pressable
                style={styles.resetButton}
                onPress={resetAllFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={() => setFilterOpen(false)}>
                <Text style={styles.applyButtonText}>Show {visiblePlaces.length} Results</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  helper: {
    ...typography.body,
    marginBottom: spacing.lg,
    color: colors.textSecondary,
  },
  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    alignSelf: "flex-start",
  },
  filterButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
    lineHeight: 20,
    includeFontPadding: false,
  },
  resultsCount: {
    ...typography.h3,
    color: colors.text,
  },
  resultsMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0,
  },
  controlLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0,
    marginBottom: spacing.sm,
  },
  scrollRow: {
    paddingRight: spacing.lg,
    marginBottom: spacing.lg,
  },
  sortChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sortChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.primary,
  },
  sortChipText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    includeFontPadding: false,
  },
  sortChipTextActive: {
    color: colors.text,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  fallbackBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 24, 29, 0.34)",
  },
  sheet: {
    width: "100%",
    maxHeight: "86%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 18,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sheetHeaderCopy: {
    flex: 1,
  },
  sheetSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sheetEyebrow: {
    ...typography.caption,
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text,
  },
  sheetSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  resultsPreview: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  resultsPreviewCount: {
    ...typography.h3,
    color: colors.text,
  },
  resultsPreviewMeta: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryRow: {
    paddingRight: spacing.sm,
    gap: spacing.sm,
  },
  summaryChip: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  summaryChipText: {
    ...typography.caption,
    color: colors.text,
    letterSpacing: 0,
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.md,
  },
  sectionHint: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  sheetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sheetSectionMeta: {
    ...typography.caption,
    color: colors.text,
    letterSpacing: 0,
  },
  toggleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    alignSelf: "flex-start",
  },
  toggleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleChipText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "700",
    lineHeight: 20,
    includeFontPadding: false,
  },
  toggleChipTextActive: {
    color: colors.text,
  },
  sheetActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  resetButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "700",
    lineHeight: 22,
    includeFontPadding: false,
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  applyButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
    lineHeight: 22,
    includeFontPadding: false,
  },
  empty: {
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
