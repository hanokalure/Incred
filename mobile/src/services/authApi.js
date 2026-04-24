import { apiGet, apiPost, apiUpload, apiDelete } from "./apiClient";

export const signup = (payload) => apiPost("/auth/signup", payload, { auth: false });
export const login = (payload) => apiPost("/auth/login", payload, { auth: false });
export const fetchMe = () => apiGet("/auth/me");

export const uploadProfilePic = (formData) => apiUpload("/uploads/profile-pic", formData);
export const deleteProfilePic = () => apiDelete("/uploads/profile-pic");
