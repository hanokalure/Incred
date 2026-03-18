import { useEffect, useMemo, useState } from "react";
import { Text, TextInput, StyleSheet, View, ScrollView, Alert } from "react-native";
import { useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import PageCard from "../components/PageCard";
import SelectField from "../components/SelectField";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { submitPlace } from "../services/placesApi";
import { uploadPlaceImage } from "../services/uploadsApi";
import { fetchDistricts } from "../services/districtsApi";

export default function SubmitPlaceScreen({ navigation }) {
  const role = useSelector((state) => state.auth.role);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [districtId, setDistrictId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [districts, setDistricts] = useState([]);
  const [cuisine, setCuisine] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [mustTry, setMustTry] = useState("");
  const [stayType, setStayType] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [amenities, setAmenities] = useState("");

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

      await submitPlace({ ...payload });
      Alert.alert("Place Added", "Your place has been saved.");
      navigation.goBack();
    } catch (e) {
      setError(e.message || "Failed to submit place");
    } finally {
      setStatus("idle");
    }
  };

  const onFileChange = (e) => {
    const selected = e?.target?.files?.[0] || null;
    setFile(selected);
    if (selected) {
      uploadImage(selected);
    }
  };

  const uploadImage = async (fileOverride) => {
    const f = fileOverride || file;
    if (!f) return;
    setUploadStatus("uploading");
    setError("");
    try {
      const res = await uploadPlaceImage(f);
      setImageUrl(res.public_url);
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploadStatus("idle");
    }
  };

  const useCurrentLocation = () => {
    if (typeof window === "undefined") return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      setError("Browser location requires HTTPS (or localhost). Open the web app on localhost or use HTTPS.");
      return;
    }
    if (!navigator.geolocation) {
      setError("Geolocation not supported in this browser.");
      return;
    }
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
      },
      (err) => setError(err?.message || "Unable to fetch location.")
    );
  };

  if (role && role !== "admin") {
    return (
      <PageCard>
        <ScreenHeader title="Admin Only" onBack={() => navigation.goBack()} />
        <Text style={styles.helper}>Only admins can add places.</Text>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <ScreenHeader title="Add a Place" onBack={() => navigation.goBack()} />
      <ScrollView>
        <Text style={styles.label}>Place name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />
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
        <TextInput value={latitude} onChangeText={setLatitude} style={styles.input} />
        <Text style={styles.label}>Longitude</Text>
        <TextInput value={longitude} onChangeText={setLongitude} style={styles.input} />
        <PrimaryButton label="Use My Location" onPress={useCurrentLocation} variant="ghost" />
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
          placeholder="Tell us what makes it special"
          placeholderTextColor={colors.charcoal}
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
            <TextInput value={pricePerNight} onChangeText={setPricePerNight} style={styles.input} />
            <Text style={styles.label}>Amenities (comma separated)</Text>
            <TextInput value={amenities} onChangeText={setAmenities} style={styles.input} />
          </>
        ) : null}

        <Text style={styles.label}>Photo (optional)</Text>
        <PhotoPlaceholder label="Select a photo (optional)" />
        <View style={styles.fileRow}>
          <input type="file" onChange={onFileChange} />
        </View>
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
  label: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.clay,
  },
  textArea: {
    height: 110,
    textAlignVertical: "top",
  },
  error: {
    color: colors.error || "#C0392B",
    marginBottom: spacing.md,
  },
  helper: {
    marginTop: spacing.lg,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fileRow: {
    marginBottom: spacing.md,
  },
});
