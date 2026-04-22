import { apiGet, apiPost, apiPut } from "./apiClient";

export const fetchNotifications = () => {
  return apiGet("/notifications");
};

export const markNotificationAsRead = (id) => {
  return apiPost(`/notifications/${id}/read`, {});
};

export const updateNotificationSettings = (pushEnabled) => {
  return apiPut("/notifications/settings", { push_enabled: pushEnabled });
};
