# Mobile Phase 1 Inventory

Source of truth: `mobile/`

This records the real implemented flows in the Expo app and defines the Android rewrite boundary.

## Navigation Inventory

Stack routes from `mobile/src/navigation/RootNavigator.js`:
- `Splash`
- `Onboarding`
- `Login`
- `Register`
- `MainTabs`
- `Map`
- `Nearby`
- `SearchFilter`
- `DayPlan`
- `SavedList`
- `PlaceDetail`
- `SubmitPlace`
- `MySubmissions`
- `PlaceApprovals`
- `CreateStory`
- `StoryViewer`
- `StoryArchive`
- `ReviewsList`
- `ReviewSubmit`
- `Achievements`
- `ProfileReviews`
- `Language`
- `Notifications`

Bottom tabs from `mobile/src/navigation/MainTabs.js`:
- `Home`
- `Map`
- `Itinerary`
- `Saved`
- `Profile`

Route drift found:
- multiple screens navigate to `Discover`, but `Discover` is not actually declared as a tab route in `MainTabs.js`
- `PlaceDetail` is modal in RN, but should become a normal detail destination in Android

## Auth And Startup

Files:
- `mobile/src/screens/SplashScreen.js`
- `mobile/src/screens/OnboardingScreen.js`
- `mobile/src/screens/LoginScreen.js`
- `mobile/src/screens/RegisterScreen.js`
- `mobile/src/services/authApi.js`
- `mobile/src/services/authStore.js`

Actual behavior:
- splash always goes to onboarding after 1.2s
- no persisted session bootstrap check on startup
- login uses `POST /auth/login`
- signup uses `POST /auth/signup`
- auth token/profile stored in SecureStore with localStorage fallback

Android rewrite change:
- use DataStore
- restore session on launch
- keep `/auth/me` as the validation source

## Real Endpoints Used By Mobile

Auth:
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`

Districts:
- `GET /districts`
- `GET /districts/{id}`

Places:
- `GET /places`
- `GET /places/{id}`
- `POST /places`
- `PUT /places/{id}`
- `DELETE /places/{id}`
- `GET /places/pending`
- `POST /places/{id}/approve`
- `POST /places/{id}/reject`
- `GET /places/my-submissions`
- `PUT /places/{id}/my-submission`
- `POST /places/{id}/resubmit`
- `POST /places/detect-from-link`
- `POST /places/{id}/photo-submissions`
- `GET /places/photo-submissions/pending`
- `POST /places/photo-submissions/{id}/approve`
- `POST /places/photo-submissions/{id}/reject`

Reviews:
- `GET /reviews/{placeId}`
- `POST /reviews`

Favorites:
- `GET /favorites`
- `GET /favorites/places`
- `POST /favorites`
- `DELETE /favorites/{favoriteId}`

AI:
- `POST /ai/recommendations`
- `POST /ai/sentiment`

Itineraries:
- `POST /generate-itinerary`
- `GET /itineraries`

Stories:
- `GET /stories/feed`
- `GET /stories/me`
- `GET /stories/me/archive`
- `POST /stories`
- `POST /stories/{id}/view`
- `POST /stories/{id}/report`
- `POST /stories/{id}/highlight`
- `DELETE /stories/{id}`

Uploads:
- `POST /uploads/place-image`
- `POST /uploads/place-video`
- `POST /uploads/story-image`
- `POST /uploads/story-video`

Files:
- `/files/place-images/...`
- `/files/story-media/...`

## Placeholder Or Demo Logic To Replace

Redux demo state:
- `placesSlice.js`: hardcoded categories and places
- `savedSlice.js`: hardcoded saved ids
- `reviewsSlice.js`: local fallback reviews
- `recommendationsSlice.js`: seeded ids before AI call
- `langSlice.js`: local-only language toggle

Screen-level placeholders:
- `SplashScreen`: ignores stored session
- `MapScreen`: uses fake marker offsets and placeholder route/ETA
- `ItineraryScreen`: hardcodes `district_id = 1`
- `DayPlanScreen`: has static fallback schedule
- `ProfileScreen`: hardcodes user identity text
- `ProfileSubScreen`: placeholder content only
- `HomeScreen`: AI recommendations use demo payload
- `ReviewsListScreen`: local Redux fallback if API fails

Bug found:
- `PlaceDetailScreen` reads `state.auth.role`
- store has no `auth` slice
- role really lives in `authStore`

## Screen Mapping For Android Rewrite

Phase 1:
- startup/auth shell
- bottom-tab navigation
- network/config/session infrastructure

Phase 2:
- home
- discover
- map

Phase 3:
- place detail
- saved
- reviews

Phase 4:
- submit place
- my submissions
- place approvals

Phase 5:
- stories

Phase 6:
- itinerary and day plan

Non-core cleanup:
- `NearbyScreen` can likely be merged into discover/map behavior
- `ProfileSubScreen` should become real settings subsections or be dropped

## Production Rewrite Rules

- use backend APIs as source of truth, not Redux seed data
- use a single session source of truth
- normalize role-based admin access in session/domain state
- externalize base URL and Google Maps key after initial scaffold
- preserve user-visible flows while removing route drift and placeholder state
