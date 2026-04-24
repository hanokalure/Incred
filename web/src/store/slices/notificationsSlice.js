import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchNotifications } from "../../services/notificationsApi";

export const loadNotifications = createAsyncThunk(
  "notifications/loadNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchNotifications();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  pushEnabled: true,
  status: "idle",
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
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
    markAllReadLocal: (state) => {
      state.notifications.forEach((n) => { n.is_read = true; });
      state.unreadCount = 0;
    },
    addNotification: (state, action) => {
      // Avoid duplicates
      const exists = state.notifications.some((n) => n.id === action.payload.id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        if (!action.payload.is_read) {
          state.unreadCount += 1;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.is_read).length;
      })
      .addCase(loadNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { setPushEnabled, markReadLocal, markAllReadLocal, addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
