import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Alert, Linking, Platform } from "react-native";
import { colors } from "../theme/colors";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import PageCard from "../components/PageCard";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaceDetails } from "../services/placesApi";
import { fetchSavedPlaces, removeSavedPlace, savePlace } from "../services/savedApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { getPlaceCategoryLabel } from "../constants/placeCategories";

export default function PlaceDetailScreen({ navigation, route }) {
  const placeParam = route?.params?.id;
  const placeId = Number.isFinite(Number(placeParam)) ? Number(placeParam) : null;
  const [place, setPlace] = useState(null);
  const [favoriteId, setFavoriteId] = useState(null);

  useEffect(() => {
    if (!placeId) return;
    fetchPlaceDetails(placeId)
      .then((data) => setPlace(data))
      .catch(() => setPlace(null));
    fetchSavedPlaces()
      .then((favorites) => {
        const match = (favorites || []).find((f) => Number(f.place_id) === Number(placeId));
        setFavoriteId(match ? match.id : null);
      })
      .catch(() => setFavoriteId(null));
  }, [placeId]);

  const handleToggleSaved = async () => {
    if (!placeId) return;
    try {
      if (favoriteId) {
        await removeSavedPlace(favoriteId);
        // Re-fetch to keep state consistent with server.
        const favorites = await fetchSavedPlaces();
        const match = (favorites || []).find((f) => Number(f.place_id) === Number(placeId));
        setFavoriteId(match ? match.id : null);
      } else {
        await savePlace(placeId);
        const favorites = await fetchSavedPlaces();
        const match = (favorites || []).find((f) => Number(f.place_id) === Number(placeId));
        setFavoriteId(match ? match.id : true);
      }
    } catch (e) {
      console.warn("Failed to toggle saved:", e);
      Alert.alert("Saved", e?.message || "Failed to save this place. Please try again.");
    }
  };

  const openDirections = () => {
    if (!place?.latitude || !place?.longitude) {
      Alert.alert("Directions", "No coordinates available for this place yet.");
      return;
    }
    const destination = `${place.latitude},${place.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    Linking.openURL(url);
  };

  const handleAddToItinerary = async () => {
    if (!place?.district_id) {
      Alert.alert("Itinerary", "District is missing for this place.");
      return;
    }
    try {
      const { generateItinerary } = await import("../services/itinerariesApi");
      const res = await generateItinerary({
        district_id: place.district_id,
        days: 1,
        categories: place.category ? [place.category] : null,
      });
      navigation.navigate("DayPlan", { plan: res?.plan, district_id: place.district_id });
    } catch (e) {
      Alert.alert("Itinerary", e?.message || "Unable to add to itinerary.");
    }
  };

  return (
    <PageCard>
      <ScreenHeader title="Place Detail" onBack={() => navigation.goBack()} />
      <Text style={styles.title}>{place?.name || "Place Details"}</Text>
      <Text style={styles.meta}>
        Category: {getPlaceCategoryLabel(place?.category)} • Rating: {place?.avg_rating ?? "—"}
      </Text>
      {place?.address ? <Text style={styles.address}>{place.address}</Text> : null}
      <Text style={styles.desc}>
        {place?.description || "No description available yet."}
      </Text>

      {place?.restaurant_details ? (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Restaurant Details</Text>
          {place.restaurant_details.cuisine ? <Text style={styles.detailsText}>Cuisine: {place.restaurant_details.cuisine}</Text> : null}
          {place.restaurant_details.price_range ? <Text style={styles.detailsText}>Price: {place.restaurant_details.price_range}</Text> : null}
          {place.restaurant_details.must_try ? <Text style={styles.detailsText}>Must try: {place.restaurant_details.must_try}</Text> : null}
        </View>
      ) : null}

      {place?.stay_details ? (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Stay Details</Text>
          {place.stay_details.stay_type ? <Text style={styles.detailsText}>Type: {place.stay_details.stay_type}</Text> : null}
          {place.stay_details.price_per_night !== null && place.stay_details.price_per_night !== undefined ? (
            <Text style={styles.detailsText}>Price/night: {place.stay_details.price_per_night}</Text>
          ) : null}
          {place.stay_details.amenities?.length ? (
            <Text style={styles.detailsText}>Amenities: {place.stay_details.amenities.join(", ")}</Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.section}>Photos</Text>
      {place?.image_urls?.length ? (
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: toDisplayImageUrl(place.image_urls[0]) }}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <PhotoPlaceholder label="Place photos (coming soon)" />
      )}

      <Text style={styles.section}>Videos</Text>
      {place?.video_urls?.length ? (
        <View style={styles.videoList}>
          {place.video_urls.map((videoUrl, index) => (
            <View key={`${videoUrl}-${index}`} style={styles.videoWrap}>
              {Platform.OS === "web" ? (
                <video
                  controls
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
                  src={toDisplayMediaUrl(videoUrl)}
                />
              ) : (
                <Text style={styles.detailsText}>Video available: {videoUrl}</Text>
              )}
            </View>
          ))}
        </View>
      ) : (
        <PhotoPlaceholder label="No videos added yet" />
      )}

      <View style={styles.buttonContainer}>
        <PrimaryButton
          label={favoriteId ? "Remove from Saved" : "Save Place"}
          onPress={handleToggleSaved}
        />
        <PrimaryButton label="Add to Itinerary" onPress={handleAddToItinerary} variant="ghost" />
        <PrimaryButton label="Get Directions" onPress={openDirections} variant="ghost" />
        <PrimaryButton label="Read Reviews" onPress={() => navigation.navigate("ReviewsList", { id: placeId || placeParam })} variant="ghost" />
      </View>
    </PageCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  desc: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  address: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  section: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  heroWrap: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.accent,
    marginBottom: spacing.lg,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  videoList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  videoWrap: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonContainer: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  detailsBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  detailsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailsText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
