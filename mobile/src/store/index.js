import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import placesReducer from "./slices/placesSlice";
import savedReducer from "./slices/savedSlice";
import reviewsReducer from "./slices/reviewsSlice";
import recommendationsReducer from "./slices/recommendationsSlice";
import langReducer from "./slices/langSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    places: placesReducer,
    saved: savedReducer,
    reviews: reviewsReducer,
    recommendations: recommendationsReducer,
    lang: langReducer,
  },
});
