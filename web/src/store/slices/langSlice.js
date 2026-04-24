import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  language: 'en', // 'en', 'kn', 'hi'
};

const langSlice = createSlice({
  name: 'lang',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    toggleLanguage: (state) => {
      const cycle = { en: 'kn', kn: 'hi', hi: 'en' };
      state.language = cycle[state.language] || 'en';
    }
  },
});

export const { setLanguage, toggleLanguage } = langSlice.actions;
export default langSlice.reducer;
