import { apiGet, apiPost } from "./apiClient";
import { apiUpload } from "./apiClient";

export const fetchStoryFeed = () => apiGet("/stories/feed", { auth: false });

export const fetchMyStories = () => apiGet("/stories/me");

export const fetchMyStoryArchive = () => apiGet("/stories/me/archive");

export const createStory = (payload) => apiPost("/stories", payload);
export const recordStoryView = (storyId) => apiPost(`/stories/${storyId}/view`, {});
export const reportStory = (storyId, reason) => apiPost(`/stories/${storyId}/report`, { reason });
export const setStoryHighlight = (storyId, isHighlighted) => apiPost(`/stories/${storyId}/highlight`, { is_highlighted: isHighlighted });
export const deleteStory = async (storyId) => {
  const { apiDelete } = await import("./apiClient");
  return apiDelete(`/stories/${storyId}`);
};

export const uploadStoryImage = async (asset) => {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName || asset.name || "story.jpg",
    type: asset.mimeType || asset.type || "image/jpeg",
  });
  return apiUpload("/uploads/story-image", formData);
};

export const uploadStoryVideo = async (asset) => {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName || asset.name || "story.mp4",
    type: asset.mimeType || asset.type || "video/mp4",
  });
  return apiUpload("/uploads/story-video", formData);
};
