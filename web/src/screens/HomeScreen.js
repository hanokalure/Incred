import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSelector } from "react-redux";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import SectionHeader from "../components/SectionHeader";
import PageCard from "../components/PageCard";
import PlaceCard from "../components/PlaceCard";
import { fetchPlaces } from "../services/placesApi";
import { toDisplayImageUrl } from "../services/mediaUrl";
import { haversineKm } from "../utils/geo";
import { getBrowserLocation } from "../utils/browserLocation";
import { getPlaceCategoryLabel } from "../constants/placeCategories";
import { useLanguage } from "../context/LanguageContext";

export default function HomeScreen({ navigation }) {
  const { role, user } = useSelector(state => state.auth);
  const { t } = useLanguage();
  const [featured, setFeatured] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locError, setLocError] = useState("");

  useEffect(() => {
    fetchPlaces()
      .then((data) => setFeatured((data || []).slice(0, 6)))
      .catch(() => setFeatured([]));
  }, []);

  const resolveLocation = () => {
    setLocError("");
    getBrowserLocation()
      .then((coords) => setUserLocation(coords))
      .catch((err) => setLocError(err?.message || "Unable to get location."));
  };

  useEffect(() => {
    resolveLocation();
  }, []);

  const featuredWithDistance = useMemo(() => {
    if (!userLocation) return featured;
    return featured.map((p) => {
      const km = haversineKm(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: p.latitude, longitude: p.longitude }
      );
      return { ...p, distance: km ? Number(km.toFixed(1)) : null };
    });
  }, [featured, userLocation]);

  if (role === "admin") {
    const stats = [
      { label: "Total Places", value: "128", trend: "+12 this week" },
      { label: "Pending Approvals", value: "24", trend: "High priority", alert: true },
      { label: "Active Users", value: "1.2k", trend: "+5% vs last month" },
      { label: "Total Reviews", value: "4.8k", trend: "86% positive" },
    ];

    return (
      <PageCard>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Overview</Text>
          <Text style={styles.subtitle}>Track app performance and manage local content.</Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={[styles.statCard, stat.alert && styles.statAlert]}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={[styles.statTrend, stat.alert && styles.statTrendAlert]}>{stat.trend}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Recent Submissions" action="Approve All" />
        <View style={styles.tablePlaceholder}>
          <Text style={styles.placeholderText}>Submission list component will be loaded here...</Text>
        </View>
      </PageCard>
    );
  }

  // User Home View
  return (
    <PageCard>
      <View style={styles.header}>
        <Text style={styles.title}>{t("greeting")}, {user?.name || "Explorer"}</Text>
        <Text style={styles.subtitle}>{t("greetingSubtitle")}</Text>
        <Pressable onPress={resolveLocation} style={styles.locationBtn}>
          <Text style={styles.locationText}>
            {userLocation ? t("locationActive") : t("useMyLocation")}
          </Text>
        </Pressable>
        {locError ? <Text style={styles.locationError}>{locError}</Text> : null}
      </View>

      <SectionHeader
        title={t("featuredDiscoveries")}
        action={t("showAll")}
        onActionPress={() => navigation.navigate("Discover")}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredRow}>
        {featuredWithDistance.map((p) => (
          <View key={p.id} style={styles.featuredCardWrap}>
            <PlaceCard
              name={p.name}
              category={getPlaceCategoryLabel(p.category)}
              distance={p.distance}
              rating={p.avg_rating ?? p.rating}
              imageUrl={toDisplayImageUrl(p.image_urls?.[0])}
              onPress={() => navigation.navigate("PlaceDetail", { id: p.id })}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.promoCard}>
        <Text style={styles.promoTitle}>{t("aiGuideTitle")}</Text>
        <Text style={styles.promoText}>{t("aiGuideText")}</Text>
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  locationBtn: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  locationError: {
    marginTop: spacing.sm,
    color: colors.error || "#C0392B",
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statAlert: {
    backgroundColor: colors.accent,
    borderColor: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h1,
    fontSize: 36,
    color: colors.text,
  },
  statTrend: {
    ...typography.body,
    fontSize: 12,
    marginTop: spacing.sm,
    color: colors.success,
    fontWeight: "600",
  },
  statTrendAlert: {
    color: colors.secondary,
  },
  tablePlaceholder: {
    height: 300,
    backgroundColor: colors.background,
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    ...typography.body,
    color: colors.textMuted,
  },
  featuredRow: {
    marginLeft: -spacing.md,
    paddingLeft: spacing.md,
    marginBottom: spacing.xl,
  },
  featuredCardWrap: {
    width: 320,
    marginRight: spacing.lg,
  },
  promoCard: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    borderRadius: 24,
    marginTop: spacing.lg,
  },
  promoTitle: {
    ...typography.h2,
    color: colors.text,
  },
  promoText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.sm,
    opacity: 0.9,
  },
});
