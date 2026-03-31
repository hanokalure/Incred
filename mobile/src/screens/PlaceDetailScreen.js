import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, Alert, Platform } from "react-native";
import { Video, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { fetchPlaceDetails, submitPlaceMedia } from "../services/placesApi";
import { fetchSavedPlaces, removeSavedPlace, savePlace } from "../services/savedApi";
import { toDisplayImageUrl, toDisplayMediaUrl } from "../services/mediaUrl";
import { uploadPlaceImage, uploadPlaceVideo } from "../services/uploadsApi";

import PageCard from "../components/PageCard";

export default function PlaceDetailScreen({ navigation, route }) {
  const role = useSelector((state) => state.auth.role);
  const placeParam = route?.params?.id;
  const placeId = Number.isFinite(Number(placeParam)) ? Number(placeParam) : null;
  const [place, setPlace] = useState(null);
  const [favoriteId, setFavoriteId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [photoStatus, setPhotoStatus] = useState("idle");
  const [photoError, setPhotoError] = useState("");

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

  const isSaved = !!favoriteId;

  useEffect(() => {
    if (!placeId) return;
    setStatus("loading");
    fetchPlaceDetails(placeId)
      .then((data) => setPlace(data))
      .catch(() => setPlace(null))
      .finally(() => setStatus("idle"));

    fetchSavedPlaces()
      .then((favorites) => {
        const match = (favorites || []).find((f) => f.place_id === placeId);
        setFavoriteId(match ? match.id : null);
      })
      .catch(() => setFavoriteId(null));
  }, [placeId]);

  const handleToggleSaved = async () => {
    if (!placeId) return;
    try {
      if (favoriteId) {
        await removeSavedPlace(favoriteId);
        const favorites = await fetchSavedPlaces();
        const match = (favorites || []).find((f) => f.place_id === placeId);
        setFavoriteId(match ? match.id : null);
      } else {
        await savePlace(placeId);
        const favorites = await fetchSavedPlaces();
        const match = (favorites || []).find((f) => f.place_id === placeId);
        setFavoriteId(match ? match.id : true);
      }
    } catch (e) {
      console.warn("Failed to toggle saved:", e);
      Alert.alert("Saved", e?.message || "Failed to save this place. Please try again.");
    }
  };

  const handleAddPhoto = async () => {
    if (!placeId) return;
    setPhotoError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setPhotoError("Photo permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    setPhotoStatus("uploading");
    try {
      const upload = await uploadPlaceImage(result.assets[0]);
      setPhotoStatus("submitting");
      await submitPlaceMedia(placeId, "image", upload.public_url);
      setPhotoStatus("submitted");
      Alert.alert("Photo Submitted", "Your photo was sent for admin approval.");
    } catch (e) {
      setPhotoStatus("idle");
      setPhotoError(e?.message || "Photo submission failed.");
    }
  };

  const handleAddVideo = async () => {
    if (!placeId) return;
    setPhotoError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setPhotoError("Video permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    setPhotoStatus("uploading-video");
    try {
      const upload = await uploadPlaceVideo(result.assets[0]);
      setPhotoStatus("submitting-video");
      await submitPlaceMedia(placeId, "video", upload.public_url);
      setPhotoStatus("submitted-video");
      Alert.alert("Video Submitted", "Your video was sent for admin approval.");
    } catch (e) {
      setPhotoStatus("idle");
      setPhotoError(e?.message || "Video submission failed.");
    }
  };

  return (
    <PageCard>
      <ScreenHeader title="Place Detail" onBack={() => navigation.goBack()} />

      <View style={styles.hero}>
        {place?.image_urls?.length ? (
          <Image
            source={{ uri: toDisplayImageUrl(place.image_urls[0]) }}
            style={styles.heroImage}
            resizeMode="contain"
            onError={() => {}}
          />
        ) : (
          <Text style={styles.emptyText}>No photos added yet.</Text>
        )}
      </View>

      {place?.image_urls?.length > 1 ? (
        <>
          <Text style={styles.section}>Photos</Text>
          <View style={styles.gallery}>
            {place.image_urls.slice(0, 3).map((imageUrl, index) => (
              <View key={`${imageUrl}-${index}`} style={styles.galleryItem}>
                <Image source={{ uri: toDisplayImageUrl(imageUrl) }} style={styles.galleryImage} resizeMode="cover" />
              </View>
            ))}
          </View>
        </>
      ) : null}
      {role !== "admin" ? (
        <View style={styles.photoSubmitBox}>
          <Text style={styles.detailsTitle}>Add Your Photo</Text>
          <Text style={styles.detailsText}>You can suggest more photos for this place. Admin approval is required.</Text>
          <PrimaryButton
            label={
              photoStatus === "uploading"
                ? "Uploading..."
                : photoStatus === "submitting"
                  ? "Submitting..."
                  : "Add Photo"
            }
            onPress={handleAddPhoto}
            variant="ghost"
          />
          {photoStatus === "submitted" ? <Text style={styles.successText}>Photo submitted for admin approval.</Text> : null}
          {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}
        </View>
      ) : null}

      <Text style={styles.section}>Videos</Text>
      {place?.video_urls?.length ? (
        <View style={styles.videoList}>
          {place.video_urls.slice(0, 3).map((videoUrl, index) => (
            <View key={`${videoUrl}-${index}`} style={styles.videoWrap}>
              {Platform.OS === "web" ? (
                <video
                  src={toDisplayMediaUrl(videoUrl)}
                  muted
                  autoPlay
                  loop
                  playsInline
                  controls
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Video
                  source={{ uri: toDisplayMediaUrl(videoUrl) }}
                  style={styles.nativeVideo}
                  resizeMode={ResizeMode.COVER}
                  useNativeControls
                  shouldPlay
                  isLooping
                  isMuted
                />
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No videos added yet.</Text>
      )}
      {role !== "admin" ? (
        <View style={styles.photoSubmitBox}>
          <Text style={styles.detailsTitle}>Add Your Video</Text>
          <Text style={styles.detailsText}>You can suggest more videos for this place. Admin approval is required.</Text>
          <PrimaryButton
            label={
              photoStatus === "uploading-video"
                ? "Uploading Video..."
                : photoStatus === "submitting-video"
                  ? "Submitting Video..."
                  : "Add Video"
            }
            onPress={handleAddVideo}
            variant="ghost"
          />
          {photoStatus === "submitted-video" ? <Text style={styles.successText}>Video submitted for admin approval.</Text> : null}
          {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}
        </View>
      ) : null}

      <View style={styles.info}>
        <Text style={styles.title}>{place?.name || "Place Details"}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{categoryLabel(place?.category)}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.rating}>★ {place?.avg_rating ?? "—"}</Text>
        </View>
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
      </View>

      <PrimaryButton
        label={isSaved ? "Remove from Saved" : "Save to Collection"}
        onPress={handleToggleSaved}
      />
      <View style={styles.spacer} />
      <PrimaryButton label="Get Directions" onPress={() => navigation.navigate("Map")} variant="ghost" />
      <View style={styles.spacer} />
      <PrimaryButton label="Read Guest Reviews" onPress={() => navigation.navigate("ReviewsList", { id: placeId || placeParam })} variant="ghost" />
    </PageCard>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 250,
    marginVertical: spacing.lg,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.accent,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  info: {
    marginBottom: spacing.xl,
  },
  section: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  gallery: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  galleryItem: {
    flex: 1,
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  videoList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  videoWrap: {
    height: 170,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  videoFallback: {
    ...typography.body,
    color: colors.textSecondary,
  },
  nativeVideo: {
    width: "100%",
    height: "100%",
  },
  title: {
    ...typography.h1,
    fontSize: 28,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  category: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0,
  },
  dot: {
    marginHorizontal: spacing.sm,
    color: colors.textMuted,
  },
  rating: {
    ...typography.h3,
    color: colors.primary,
  },
  desc: {
    ...typography.body,
    lineHeight: 24,
  },
  address: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  spacer: {
    height: spacing.md,
  },
  detailsBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  detailsTitle: {
    ...typography.h3,
    fontSize: 16,
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
    padding: spacing.md,
    marginBottom: spacing.lg,
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
  },
});
