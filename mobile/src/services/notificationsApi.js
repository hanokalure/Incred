import { apiGet, apiPost } from "./apiClient";

export const fetchNotifications = async () => {
    return await apiGet("/notifications");
};

export const markNotificationAsRead = async (id) => {
    return await apiPost(`/notifications/${id}/read`);
};

export const registerPushToken = async (token) => {
    return await apiPost("/notifications/push-token", { push_token: token });
};

export const updateNotificationSettings = async (enabled) => {
    return await apiPut("/notifications/settings", { push_enabled: enabled });
};
