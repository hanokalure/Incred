import { apiPost } from "./apiClient";

export const detectPlaceFromGoogleMapsLink = (googleMapsLink) =>
  apiPost("/places/detect-from-link", { google_maps_link: googleMapsLink });
