import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  role: null,
  isAuthenticated: false,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user || null;
      state.role = action.payload.role || null;
      state.token = action.payload.token || null;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
