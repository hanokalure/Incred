import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Alert, Linking, Platform } from "react-native";
import { useSelector } from "react-redux";
import { colors } from "../theme/colors";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PageCard from "../components/PageCard";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaceDetails, submitPlaceMedia } from "../services/placesApi";
import { fetchSavedPlaces, removeSavedPlace, savePlace } from "../services/savedApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { getPlaceCategoryLabel } from "../constants/placeCategories";
import { uploadPlaceImage, uploadPlaceVideo } from "../services/uploadsApi";
import { useLanguage } from "../context/LanguageContext";

export default function PlaceDetailScreen({ navigation, route }) {
  const { t } = useLanguage();
  const role = useSelector((state) => state.auth.role);
  const placeParam = route?.params?.id;
  const placeId = Number.isFinite(Number(placeParam)) ? Number(placeParam) : null;
  const [place, setPlace] = useState(null);
  const [favoriteId, setFavoriteId] = useState(null);
  const [photoStatus, setPhotoStatus] = useState("idle");
  const [photoError, setPhotoError] = useState("");
  const categoryLabel = (value) => {
    const mapping = {
      restaurant: t("categoryRestaurant"),
      generational_shop: t("categoryGenerationalShop"),
      tourist_place: t("categoryTouristPlace"),
      hidden_gem: t("categoryHiddenGem"),
      stay: t("categoryStay"),
    };
    return mapping[value] || getPlaceCategoryLabel(value);
  };

  const loadPlace = () => {
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
  };

  useEffect(() => {
    loadPlace();
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
      Alert.alert(t("savedAlertTitle"), e?.message || t("saveFailed"));
    }
  };

  const openDirections = () => {
    if (!place?.latitude || !place?.longitude) {
      Alert.alert(t("directionsAlertTitle"), t("noCoordinates"));
      return;
    }
    const destination = `${place.latitude},${place.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    Linking.openURL(url);
  };

  const handleAddToItinerary = async () => {
    if (!place?.district_id) {
      Alert.alert(t("itineraryAlertTitle"), t("missingDistrict"));
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
      Alert.alert(t("itineraryAlertTitle"), e?.message || t("itineraryFailed"));
    }
  };

  const handlePhotoAdd = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file || !placeId) return;
    setPhotoStatus("uploading");
    setPhotoError("");
    try {
      const uploaded = await uploadPlaceImage(file);
      setPhotoStatus("submitting");
      await submitPlaceMedia(placeId, "image", uploaded.public_url);
      setPhotoStatus("submitted");
      Alert.alert(t("photoSubmittedAlertTitle"), t("photoSubmittedAlertBody"));
    } catch (e) {
      setPhotoStatus("idle");
      setPhotoError(e?.message || "Photo submission failed");
    }
  };

  const handleVideoAdd = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file || !placeId) return;
    setPhotoStatus("uploading-video");
    setPhotoError("");
    try {
      const uploaded = await uploadPlaceVideo(file);
      setPhotoStatus("submitting-video");
      await submitPlaceMedia(placeId, "video", uploaded.public_url);
      setPhotoStatus("submitted-video");
      Alert.alert(t("videoSubmittedAlertTitle"), t("videoSubmittedAlertBody"));
    } catch (e) {
      setPhotoStatus("idle");
      setPhotoError(e?.message || "Video submission failed");
    }
  };

  return (
    <PageCard>
      <ScreenHeader title={t("placeDetailTitle")} onBack={() => navigation.goBack()} />
      <Text style={styles.title}>{place?.name || t("placeDetailsFallback")}</Text>
      <Text style={styles.meta}>
        {t("categoryLabel")}: {categoryLabel(place?.category)} • {t("ratingLabel")}: {place?.avg_rating ?? "—"}
      </Text>
      {place?.address ? <Text style={styles.address}>{place.address}</Text> : null}
      <Text style={styles.desc}>
        {place?.description || t("noDescription")}
      </Text>

      {place?.restaurant_details ? (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>{t("restaurantDetails")}</Text>
          {place.restaurant_details.cuisine ? <Text style={styles.detailsText}>{t("cuisine")}: {place.restaurant_details.cuisine}</Text> : null}
          {place.restaurant_details.price_range ? <Text style={styles.detailsText}>{t("price")}: {place.restaurant_details.price_range}</Text> : null}
          {place.restaurant_details.must_try ? <Text style={styles.detailsText}>{t("mustTry")}: {place.restaurant_details.must_try}</Text> : null}
        </View>
      ) : null}

      {place?.stay_details ? (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>{t("stayDetails")}</Text>
          {place.stay_details.stay_type ? <Text style={styles.detailsText}>{t("type")}: {place.stay_details.stay_type}</Text> : null}
          {place.stay_details.price_per_night !== null && place.stay_details.price_per_night !== undefined ? (
            <Text style={styles.detailsText}>{t("pricePerNight")}: {place.stay_details.price_per_night}</Text>
          ) : null}
          {place.stay_details.amenities?.length ? (
            <Text style={styles.detailsText}>{t("amenities")}: {place.stay_details.amenities.join(", ")}</Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.section}>{t("photos")}</Text>
      {place?.image_urls?.length ? (
        <View style={styles.photoList}>
          {place.image_urls.map((imageUrl, index) => (
            <View key={`${imageUrl}-${index}`} style={styles.photoCard}>
              <Image
                source={{ uri: toDisplayImageUrl(imageUrl) }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>{t("noPhotos")}</Text>
      )}
      {role !== "admin" ? (
        <View style={styles.photoSubmitBox}>
          <Text style={styles.detailsTitle}>{t("addYourPhoto")}</Text>
          <Text style={styles.detailsText}>{t("addYourPhotoHint")}</Text>
          <View style={styles.fileInputWrap}>
            <input type="file" accept="image/*" onChange={handlePhotoAdd} />
          </View>
          {photoStatus === "uploading" ? <Text style={styles.statusText}>{t("uploadPhoto")}</Text> : null}
          {photoStatus === "submitting" ? <Text style={styles.statusText}>{t("submitApproval")}</Text> : null}
          {photoStatus === "submitted" ? <Text style={styles.successText}>{t("photoSubmitted")}</Text> : null}
          {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}
        </View>
      ) : null}

      <Text style={styles.section}>{t("videos")}</Text>
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
        <Text style={styles.emptyText}>{t("noVideos")}</Text>
      )}
      {role !== "admin" ? (
        <View style={styles.photoSubmitBox}>
          <Text style={styles.detailsTitle}>{t("addYourVideo")}</Text>
          <Text style={styles.detailsText}>{t("addYourVideoHint")}</Text>
          <View style={styles.fileInputWrap}>
            <input type="file" accept="video/*" onChange={handleVideoAdd} />
          </View>
          {photoStatus === "uploading-video" ? <Text style={styles.statusText}>{t("uploadVideo")}</Text> : null}
          {photoStatus === "submitting-video" ? <Text style={styles.statusText}>{t("submitVideoApproval")}</Text> : null}
          {photoStatus === "submitted-video" ? <Text style={styles.successText}>{t("videoSubmitted")}</Text> : null}
          {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}
        </View>
      ) : null}

      <View style={styles.buttonContainer}>
        <PrimaryButton
          label={favoriteId ? t("removeFromSaved") : t("savePlace")}
          onPress={handleToggleSaved}
        />
        <PrimaryButton label={t("addToItinerary")} onPress={handleAddToItinerary} variant="ghost" />
        <PrimaryButton label={t("getDirections")} onPress={openDirections} variant="ghost" />
        <PrimaryButton label={t("readReviews")} onPress={() => navigation.navigate("ReviewsList", { id: placeId || placeParam })} variant="ghost" />
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
  photoList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  photoCard: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.accent,
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
  photoSubmitBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  fileInputWrap: {
    marginTop: spacing.sm,
  },
  statusText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  successText: {
    ...typography.body,
    color: colors.success,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
});
