import apiClient from "./apiClient";

export const fetchNotifications = async () => {
    return await apiClient.get("/notifications");
};

export const markNotificationAsRead = async (id) => {
    return await apiClient.post(`/notifications/${id}/read`);
};

export const registerPushToken = async (token) => {
    return await apiClient.post("/notifications/push-token", { push_token: token });
};
