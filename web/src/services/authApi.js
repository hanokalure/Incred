import { apiGet, apiPost, apiUpload } from "./apiClient";

export const signup = (payload) => apiPost("/auth/signup", payload, { auth: false });
export const login = (payload) => apiPost("/auth/login", payload, { auth: false });
export const fetchMe = () => apiGet("/auth/me");

export const uploadProfilePic = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload("/uploads/profile-pic", formData);
};
