import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Image } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import PageCard from "../components/PageCard";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import {
  approvePlace,
  approvePlacePhotoSubmission,
  fetchPendingPlacePhotoSubmissions,
  fetchPendingPlaces,
  rejectPlace,
  rejectPlacePhotoSubmission,
} from "../services/placesApi";
import { toDisplayImageUrl } from "../services/mediaUrl";

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

export default function PlaceApprovalScreen({ navigation }) {
  const [pendingPlaces, setPendingPlaces] = useState([]);
  const [pendingPhotoSubmissions, setPendingPhotoSubmissions] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [rejectReasonById, setRejectReasonById] = useState({});

  const loadPending = useCallback(() => {
    fetchPendingPlaces()
      .then((rows) => setPendingPlaces(rows || []))
      .catch((e) => setError(e?.message || "Failed to load pending places"));
    fetchPendingPlacePhotoSubmissions()
      .then((rows) => setPendingPhotoSubmissions(rows || []))
      .catch((e) => setError(e?.message || "Failed to load pending media submissions"));
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleApprove = async (id) => {
    setStatus(`approve-${id}`);
    setError("");
    try {
      await approvePlace(id);
      loadPending();
    } catch (e) {
      setError(e?.message || "Approval failed");
    } finally {
      setStatus("idle");
    }
  };

  const handleReject = async (id) => {
    setStatus(`reject-${id}`);
    setError("");
    try {
      await rejectPlace(id, rejectReasonById[id] || "");
      loadPending();
    } catch (e) {
      setError(e?.message || "Rejection failed");
    } finally {
      setStatus("idle");
    }
  };

  const handlePhotoApprove = async (id) => {
    setStatus(`approve-photo-${id}`);
    setError("");
    try {
      await approvePlacePhotoSubmission(id);
      loadPending();
    } catch (e) {
      setError(e?.message || "Media approval failed");
    } finally {
      setStatus("idle");
    }
  };

  const handlePhotoReject = async (id) => {
    setStatus(`reject-photo-${id}`);
    setError("");
    try {
      await rejectPlacePhotoSubmission(id, rejectReasonById[`photo-${id}`] || "");
      loadPending();
    } catch (e) {
      setError(e?.message || "Media rejection failed");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <PageCard>
      <ScreenHeader title="Place Approvals" onBack={() => navigation.goBack()} />
      <Text style={styles.subtitle}>Review and verify community-submitted discovery points.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {pendingPlaces.length === 0 ? <Text style={styles.empty}>No pending submissions right now.</Text> : null}
      {pendingPlaces.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {categoryLabel(item.category)} • District {item.district_id}
          </Text>

          {item.image_urls && item.image_urls.length > 0 && (
            <View style={styles.previewWrap}>
              <Image source={{ uri: toDisplayImageUrl(item.image_urls[0]) }} style={styles.previewImage} resizeMode="cover" />
            </View>
          )}

          {item.description ? (
            <Text style={styles.detailsText}><Text style={styles.bold}>Description: </Text>{item.description}</Text>
          ) : null}
          {item.address ? (
            <Text style={styles.detailsText}><Text style={styles.bold}>Address: </Text>{item.address}</Text>
          ) : null}
          
          {item.category === "restaurant" && item.restaurant_details && (
            <Text style={styles.detailsText}>
              <Text style={styles.bold}>Cuisine:</Text> {item.restaurant_details.cuisine} • <Text style={styles.bold}>Price:</Text> {item.restaurant_details.price_range} • <Text style={styles.bold}>Must Try:</Text> {item.restaurant_details.must_try}
            </Text>
          )}
          {item.category === "stay" && item.stay_details && (
            <Text style={styles.detailsText}>
              <Text style={styles.bold}>Type:</Text> {item.stay_details.stay_type} • <Text style={styles.bold}>Price/Night:</Text> ₹{item.stay_details.price_per_night} • <Text style={styles.bold}>Amenities:</Text> {item.stay_details.amenities?.join(", ")}
            </Text>
          )}

          <TextInput
            style={[styles.input, { marginTop: spacing.md }]}
            value={rejectReasonById[item.id] || ""}
            onChangeText={(value) => setRejectReasonById((prev) => ({ ...prev, [item.id]: value }))}
            placeholder="Optional rejection reason"
            placeholderTextColor={colors.textSecondary}
          />
          <View style={styles.actions}>
            <PrimaryButton
              label={status === `approve-${item.id}` ? "Approving..." : "Approve"}
              onPress={() => handleApprove(item.id)}
            />
            <PrimaryButton
              label={status === `reject-${item.id}` ? "Rejecting..." : "Reject"}
              onPress={() => handleReject(item.id)}
              variant="ghost"
            />
          </View>
        </View>
      ))}
      <Text style={styles.subtitle}>Pending media additions</Text>
      {pendingPhotoSubmissions.length === 0 ? <Text style={styles.empty}>No pending media submissions right now.</Text> : null}
      {pendingPhotoSubmissions.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.name}>{item.place_name || `Place ${item.place_id}`}</Text>
          <Text style={styles.meta}>Submitted by {item.submitted_by_name || "Member"}</Text>
          <View style={styles.previewWrap}>
            {item.media_type === "video" ? (
              <Text style={styles.meta}>Pending video: {item.video_url || item.media_url}</Text>
            ) : (
              <Image source={{ uri: toDisplayImageUrl(item.image_url || item.media_url) }} style={styles.previewImage} resizeMode="cover" />
            )}
          </View>
          <TextInput
            style={styles.input}
            value={rejectReasonById[`photo-${item.id}`] || ""}
            onChangeText={(value) => setRejectReasonById((prev) => ({ ...prev, [`photo-${item.id}`]: value }))}
            placeholder="Optional rejection reason"
            placeholderTextColor={colors.textSecondary}
          />
          <View style={styles.actions}>
            <PrimaryButton
              label={status === `approve-photo-${item.id}` ? "Approving..." : "Approve Media"}
              onPress={() => handlePhotoApprove(item.id)}
            />
            <PrimaryButton
              label={status === `reject-photo-${item.id}` ? "Rejecting..." : "Reject Media"}
              onPress={() => handlePhotoReject(item.id)}
              variant="ghost"
            />
          </View>
        </View>
      ))}
    </PageCard>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
  },
  meta: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  detailsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "700",
    color: colors.text,
  },
  input: {
    backgroundColor: colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  previewWrap: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  error: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.error,
    marginBottom: spacing.md,
  },
  empty: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
  },
});
