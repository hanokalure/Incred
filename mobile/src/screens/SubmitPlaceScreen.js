import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import PageCard from "../components/PageCard";
import SelectField from "../components/SelectField";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { submitPlace } from "../services/placesApi";
import { getAuthProfile } from "../services/authStore";
import { uploadPlaceImage } from "../services/uploadsApi";
import { fetchDistricts } from "../services/districtsApi";
import { detectPlaceFromGoogleMapsLink } from "../services/locationDetectApi";

export default function SubmitPlaceScreen({ navigation }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [districtId, setDistrictId] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [imageAsset, setImageAsset] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [locStatus, setLocStatus] = useState("idle");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [detectStatus, setDetectStatus] = useState("idle");
  const [districts, setDistricts] = useState([]);
  const [cuisine, setCuisine] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [mustTry, setMustTry] = useState("");
  const [stayType, setStayType] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [amenities, setAmenities] = useState("");

  useEffect(() => {
    getAuthProfile()
      .then((profile) => setRole(profile?.role || "user"))
      .catch(() => setRole("user"));
  }, []);

  useEffect(() => {
    fetchDistricts()
      .then((data) => setDistricts(data || []))
      .catch(() => setDistricts([]));
  }, []);

  const categoryOptions = useMemo(
    () => [
      { label: "Restaurant", value: "restaurant" },
      { label: "Generational Shop", value: "generational_shop" },
      { label: "Tourist Place", value: "tourist_place" },
      { label: "Hidden Gem", value: "hidden_gem" },
      { label: "Stay", value: "stay" },
    ],
    []
  );

  const districtOptions = useMemo(
    () => (districts || []).map((d) => ({ label: d.name, value: d.id })),
    [districts]
  );

  const handleSubmit = async () => {
    setStatus("loading");
    setError("");
    try {
      if (!name || !category || !districtId) {
        setError("Name, category, and district are required.");
        setStatus("idle");
        return;
      }

      const payload = {
        name,
        district_id: Number(districtId),
        category,
        description,
        address,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        image_urls: imageUrl ? [imageUrl] : [],
      };

      if (category === "restaurant") {
        payload.restaurant_details = {
          cuisine: cuisine || null,
          price_range: priceRange || null,
          must_try: mustTry || null,
        };
      }

      if (category === "stay") {
        payload.stay_details = {
          stay_type: stayType || null,
          price_per_night: pricePerNight ? Number(pricePerNight) : null,
          amenities: amenities
            ? amenities.split(",").map((a) => a.trim()).filter(Boolean)
            : null,
        };
      }

      await submitPlace({
        ...payload,
      });
      Alert.alert("Place Added", "Your place has been saved.");
      navigation.goBack();
    } catch (e) {
      setError(e.message || "Failed to submit place");
    } finally {
      setStatus("idle");
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Photo permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setImageAsset(asset);
      uploadImage(asset);
    }
  };

  const useCurrentLocation = async () => {
    setLocStatus("loading");
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("Location permission is required. Enable it in Settings and try again.");
        return;
      }

      const provider = await Location.getProviderStatusAsync();
      if (!provider.locationServicesEnabled) {
        setError("Location services are turned off. Enable GPS/location services and try again.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
    } catch (e) {
      setError(e?.message || "Unable to fetch location.");
    } finally {
      setLocStatus("idle");
    }
  };

  const uploadImage = async (assetOverride) => {
    const asset = assetOverride || imageAsset;
    if (!asset) return;
    setUploadStatus("uploading");
    setError("");
    try {
      const res = await uploadPlaceImage(asset);
      setImageUrl(res.public_url);
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploadStatus("idle");
    }
  };

  const detectFromMapsLink = async () => {
    setDetectStatus("loading");
    setError("");
    try {
      const detected = await detectPlaceFromGoogleMapsLink(googleMapsLink);
      setLatitude(detected.latitude ? String(detected.latitude) : "");
      setLongitude(detected.longitude ? String(detected.longitude) : "");
      setAddress(detected.address || "");
      if (detected.districtId) {
        setDistrictId(detected.districtId);
      } else if (detected.district_id) {
        setDistrictId(detected.district_id);
      }
      if (detected.name && !name.trim()) {
        setName(detected.name);
      }
      if (!detected.districtId && !detected.district_id) {
        setError("Location found, but district could not be matched automatically. Please choose it manually.");
      }
    } catch (e) {
      setError(e.message || "Could not detect details from the Google Maps link.");
    } finally {
      setDetectStatus("idle");
    }
  };

  if (role && role !== "admin") {
    return (
      <PageCard>
        <ScreenHeader title="Admin Only" onBack={() => navigation.goBack()} />
        <Text style={styles.text}>Only admins can add places.</Text>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <ScreenHeader title="Add a Place" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.content}>
        <Text style={styles.label}>Place name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />
        <Text style={styles.label}>Google Maps Link</Text>
        <TextInput
          value={googleMapsLink}
          onChangeText={setGoogleMapsLink}
          style={styles.input}
          placeholder="Paste Google Maps place link"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <PrimaryButton
          label={detectStatus === "loading" ? "Detecting..." : "Detect From Link"}
          onPress={detectFromMapsLink}
          variant="ghost"
        />
        <Text style={styles.helper}>We will try to fill address, district, latitude, and longitude from the link.</Text>
        <SelectField
          label="Category"
          placeholder="Choose category"
          value={category}
          options={categoryOptions}
          onChange={setCategory}
        />
        <SelectField
          label="District"
          placeholder="Choose district"
          value={districtId}
          options={districtOptions}
          onChange={setDistrictId}
        />
        <Text style={styles.label}>Address</Text>
        <TextInput value={address} onChangeText={setAddress} style={styles.input} />
        <Text style={styles.label}>Latitude</Text>
        <TextInput value={latitude} onChangeText={setLatitude} style={styles.input} keyboardType="numeric" />
        <Text style={styles.label}>Longitude</Text>
        <TextInput value={longitude} onChangeText={setLongitude} style={styles.input} keyboardType="numeric" />
        <PrimaryButton
          label={locStatus === "loading" ? "Fetching..." : "Use My Location"}
          onPress={useCurrentLocation}
          variant="ghost"
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
        />

        {category === "restaurant" ? (
          <>
            <Text style={styles.label}>Cuisine</Text>
            <TextInput value={cuisine} onChangeText={setCuisine} style={styles.input} />
            <Text style={styles.label}>Price Range</Text>
            <TextInput value={priceRange} onChangeText={setPriceRange} style={styles.input} />
            <Text style={styles.label}>Must Try</Text>
            <TextInput value={mustTry} onChangeText={setMustTry} style={styles.input} />
          </>
        ) : null}

        {category === "stay" ? (
          <>
            <Text style={styles.label}>Stay Type</Text>
            <TextInput value={stayType} onChangeText={setStayType} style={styles.input} />
            <Text style={styles.label}>Price Per Night</Text>
            <TextInput value={pricePerNight} onChangeText={setPricePerNight} style={styles.input} keyboardType="numeric" />
            <Text style={styles.label}>Amenities (comma separated)</Text>
            <TextInput value={amenities} onChangeText={setAmenities} style={styles.input} />
          </>
        ) : null}

        <Text style={styles.label}>Photo (optional)</Text>
        <PhotoPlaceholder label="Select a photo (optional)" />
        <PrimaryButton
          label={imageAsset ? "Select Another Photo" : "Select Photo"}
          onPress={pickImage}
          variant="ghost"
        />
        {uploadStatus === "uploading" ? <Text style={styles.helper}>Uploading photo…</Text> : null}
        {imageUrl ? <Text style={styles.helper}>Uploaded: {imageUrl}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={status === "loading" ? "Submitting..." : "Submit Place"}
          onPress={handleSubmit}
        />
      </ScrollView>
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 110,
    textAlignVertical: "top",
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.md,
  },
  helper: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
});
