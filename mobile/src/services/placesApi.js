import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export const fetchPlaces = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiGet(query ? `/places?${query}` : "/places");
};

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
