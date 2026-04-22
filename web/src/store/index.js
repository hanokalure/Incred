import { configureStore } from "@reduxjs/toolkit";
import placesReducer from "./slices/placesSlice";
import savedReducer from "./slices/savedSlice";
import reviewsReducer from "./slices/reviewsSlice";
import recommendationsReducer from "./slices/recommendationsSlice";
import authReducer from "./slices/authSlice";
import notificationsReducer from "./slices/notificationsSlice";

export const store = configureStore({
  reducer: {
    places: placesReducer,
    saved: savedReducer,
    reviews: reviewsReducer,
    recommendations: recommendationsReducer,
    auth: authReducer,
    notifications: notificationsReducer,
  },
});
