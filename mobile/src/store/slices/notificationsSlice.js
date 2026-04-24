import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchNotifications as apiFetchNotifications, updateNotificationSettings } from "../../services/notificationsApi";
import { supabase } from "../../services/supabaseClient";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue, getState }) => {
    try {
      const userId = getState()?.auth?.user?.id;
      const token = getState()?.auth?.token;

      if (!userId) return rejectWithValue("Not logged in");

      // Inject the user's JWT so Supabase RLS can evaluate auth.uid() correctly.
      // Without this, the anon client has no session → auth.uid() = null → RLS
      // silently returns 0 rows even though data exists.
      if (token) {
        await supabase.auth.setSession({
          access_token: token,
          refresh_token: token, // placeholder — we only need access_token for RLS
        });
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("[Notifications] Supabase query failed:", error.message, "— falling back to API");
        return await apiFetchNotifications();
      }

      return data || [];
    } catch (err) {
      console.warn("[Notifications] Exception:", err.message, "— falling back to API");
      try {
        return await apiFetchNotifications();
      } catch (apiErr) {
        return rejectWithValue(apiErr.message);
      }
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
    markAllReadLocal: (state) => {
      state.notifications.forEach((n) => { n.is_read = true; });
      state.unreadCount = 0;
    },
    addNotification: (state, action) => {
      // Avoid duplicates if polling and realtime overlap
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

export const { setPushEnabled, markReadLocal, markAllReadLocal, addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
