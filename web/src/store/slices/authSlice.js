import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    role: null, // 'admin' | 'user'
    isAuthenticated: false,
    token: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.user = action.payload.user;
            state.role = action.payload.role;
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
            state.user = { ...state.user, ...action.payload };
        },
    },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
