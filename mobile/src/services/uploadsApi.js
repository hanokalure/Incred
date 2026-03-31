import { apiUpload } from "./apiClient";

export const uploadPlaceImage = async (asset) => {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName || asset.name || "place.jpg",
    type: asset.mimeType || asset.type || "image/jpeg",
  });
  return apiUpload("/uploads/place-image", formData);
};

export const uploadReviewImage = async (asset) => {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName || asset.name || "review.jpg",
    type: asset.mimeType || asset.type || "image/jpeg",
  });
  return apiUpload("/uploads/place-image", formData);
};

export const uploadPlaceVideo = async (asset) => {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName || asset.name || "place.mp4",
    type: asset.mimeType || asset.type || "video/mp4",
  });
  return apiUpload("/uploads/place-video", formData);
};
