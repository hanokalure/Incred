import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [
    "Food",
    "Stay",
    "Shops",
    "Hidden Gems",
    "Temples",
    "Nature",
    "Historical Places",
    "Local Picks",
  ],
  featured: [
    { id: "p1", name: "CTR Bengaluru", category: "Food", distance: 2.4, rating: 4.7 },
    { id: "p2", name: "Hampi Riverside", category: "Nature", distance: 6.1, rating: 4.8 },
    { id: "p3", name: "Mysuru Silk House", category: "Shops", distance: 3.3, rating: 4.5 },
  ],
  places: [
    { id: "p1", name: "CTR Bengaluru", category: "Food", distance: 2.4, rating: 4.7, lat: 12.9982, lng: 77.5714 },
    { id: "p2", name: "Hampi Riverside", category: "Nature", distance: 6.1, rating: 4.8, lat: 15.3350, lng: 76.4600 },
    { id: "p3", name: "Mysuru Silk House", category: "Shops", distance: 3.3, rating: 4.5, lat: 12.3051, lng: 76.6552 },
    { id: "p4", name: "Belur Temple", category: "Temples", distance: 12.2, rating: 4.6, lat: 13.1612, lng: 75.8647 },
    { id: "p5", name: "Coorg Homestay", category: "Stay", distance: 18.4, rating: 4.4, lat: 12.4244, lng: 75.7382 },
    { id: "p6", name: "Kabini Hideout", category: "Hidden Gems", distance: 25.5, rating: 4.5, lat: 11.9167, lng: 76.2500 },
  ],
  selectedCategory: "All",
};

const placesSlice = createSlice({
  name: "places",
  initialState,
  reducers: {
    setCategory(state, action) {
      state.selectedCategory = action.payload;
    },
    clearCategory(state) {
      state.selectedCategory = "All";
    },
  },
});

export const { setCategory, clearCategory } = placesSlice.actions;
export default placesSlice.reducer;
