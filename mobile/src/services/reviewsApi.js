import { apiGet, apiPost } from "./apiClient";

export const fetchReviews = (placeId) => apiGet(`/reviews/${placeId}`);
export const fetchMyReviews = () => apiGet("/reviews/me");
export const submitReview = (payload) => apiPost("/reviews", payload);
