import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchNotifications as apiFetchNotifications, updateNotificationSettings } from "../../services/notificationsApi";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiFetchNotifications();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const togglePushEnabled = createAsyncThunk(
  "notifications/togglePush",
  async (enabled, { rejectWithValue }) => {
    try {
      await updateNotificationSettings(enabled);
      return enabled;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount: 0,
    pushEnabled: true,
    loading: false,
    error: null,
  },
  reducers: {
    setPushEnabled: (state, action) => {
      state.pushEnabled = action.payload;
    },
    markReadLocal: (state, action) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif && !notif.is_read) {
        notif.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.is_read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(togglePushEnabled.fulfilled, (state, action) => {
        state.pushEnabled = action.payload;
      })
      .addMatcher(
        (action) => action.type === "auth/login",
        (state, action) => {
          if (action.payload.user && action.payload.user.push_enabled !== undefined) {
            state.pushEnabled = action.payload.user.push_enabled;
          }
        }
      );
  },
});

export const { setPushEnabled, markReadLocal } = notificationsSlice.actions;
export default notificationsSlice.reducer;
