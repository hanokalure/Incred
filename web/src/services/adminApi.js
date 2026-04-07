import { apiGet } from "./apiClient";
import { apiPost } from "./apiClient";

export const fetchAdminDashboard = () => apiGet("/admin/dashboard");
export const fetchAdminUsers = () => apiGet("/admin/users");
export const fetchAdminAnalytics = () => apiGet("/admin/analytics");
export const fetchAdminSettings = () => apiGet("/admin/settings");
export const fetchAdminStoryReports = () => apiGet("/admin/story-reports");
export const actOnAdminStoryReport = (reportId, action, adminNote) =>
  apiPost(`/admin/story-reports/${reportId}`, { action, admin_note: adminNote || null });
