import { apiGet } from "./apiClient";

export const fetchAdminDashboard = () => apiGet("/admin/dashboard");
export const fetchAdminUsers = () => apiGet("/admin/users");
export const fetchAdminAnalytics = () => apiGet("/admin/analytics");
export const fetchAdminSettings = () => apiGet("/admin/settings");
