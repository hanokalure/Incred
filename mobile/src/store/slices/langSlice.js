import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    language: "en", // 'en', 'kn' or 'hi'
};

const langSlice = createSlice({
    name: "lang",
    initialState,
    reducers: {
        setLanguage: (state, action) => {
            state.language = action.payload;
        },
        toggleLanguage: (state) => {
            state.language = state.language === "en" ? "kn" : "en";
        },
    },
});

export const { setLanguage, toggleLanguage } = langSlice.actions;
export default langSlice.reducer;
