import { apiUpload } from "./apiClient";

export const uploadPlaceImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload("/uploads/place-image", formData);
};

export const uploadPlaceVideo = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload("/uploads/place-video", formData);
};

export const uploadReviewImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload("/uploads/place-image", formData);
};
