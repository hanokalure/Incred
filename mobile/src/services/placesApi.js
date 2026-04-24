import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const fetchPlaces = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiGet(query ? `/places?${query}` : "/places");
};
export const fetchPlaceCategories = () => apiGet("/places/categories");

// Fallback for existing screens: use backend list endpoint
export const fetchNearbyPlaces = () => fetchPlaces();

export const fetchPlaceDetails = (id) => apiGet(`/places/${id}`);
export const submitPlace = (payload) => apiPost("/places", payload);
export const updatePlace = (id, payload) => apiPut(`/places/${id}`, payload);
export const deletePlace = (id) => apiDelete(`/places/${id}`);
export const fetchPendingPlaces = () => apiGet("/places/pending");
export const approvePlace = (id) => apiPost(`/places/${id}/approve`, {});
export const rejectPlace = (id, rejectionReason = "") =>
  apiPost(`/places/${id}/reject`, { rejection_reason: rejectionReason || null });
export const fetchMySubmissions = () => apiGet("/places/my-submissions");
export const updateMySubmission = (id, payload) => apiPut(`/places/${id}/my-submission`, payload);
export const resubmitMySubmission = (id) => apiPost(`/places/${id}/resubmit`, {});
export const submitPlacePhoto = (id, imageUrl) => apiPost(`/places/${id}/photo-submissions`, { image_url: imageUrl });
export const submitPlaceMedia = (id, mediaType, mediaUrl) =>
  apiPost(`/places/${id}/photo-submissions`, { media_type: mediaType, media_url: mediaUrl });
export const fetchPendingPlacePhotoSubmissions = () => apiGet("/places/photo-submissions/pending");
export const approvePlacePhotoSubmission = (id) => apiPost(`/places/photo-submissions/${id}/approve`, {});
export const rejectPlacePhotoSubmission = (id, rejectionReason = "") =>
  apiPost(`/places/photo-submissions/${id}/reject`, { rejection_reason: rejectionReason || null });

export const fetchMapRegionConfig = () => apiGet("/config/map-region");
