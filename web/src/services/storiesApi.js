import { apiGet, apiPost, apiUpload } from "./apiClient";

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

export const uploadStoryImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload("/uploads/story-image", formData);
};

export const uploadStoryVideo = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload("/uploads/story-video", formData);
};
