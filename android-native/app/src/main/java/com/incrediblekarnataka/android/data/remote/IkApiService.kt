package com.incrediblekarnataka.android.data.remote

import com.incrediblekarnataka.android.data.model.AuthResponse
import com.incrediblekarnataka.android.data.model.DistrictDto
import com.incrediblekarnataka.android.data.model.LoginRequest
import com.incrediblekarnataka.android.data.model.PlaceCardDto
import com.incrediblekarnataka.android.data.model.SignupRequest
import com.incrediblekarnataka.android.data.model.UserDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.DELETE
import retrofit2.http.Query
import com.incrediblekarnataka.android.data.model.FavoriteCreate
import com.incrediblekarnataka.android.data.model.FavoriteDto
import com.incrediblekarnataka.android.data.model.ItineraryDto
import com.incrediblekarnataka.android.data.model.ItineraryGenerateRequest
import com.incrediblekarnataka.android.data.model.ReviewCreate
import com.incrediblekarnataka.android.data.model.ReviewDto

interface IkApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @POST("auth/signup")
    suspend fun signup(@Body request: SignupRequest): AuthResponse

    @GET("auth/me")
    suspend fun fetchMe(): UserDto

    @GET("places")
    suspend fun fetchPlaces(
        @Query("category") category: String? = null,
        @Query("district_id") districtId: Int? = null
    ): List<PlaceCardDto>

    @GET("places/{id}")
    suspend fun fetchPlaceDetails(@Path("id") placeId: Int): PlaceCardDto

    @GET("districts")
    suspend fun fetchDistricts(): List<DistrictDto>

    @POST("favorites")
    suspend fun createFavorite(@Body payload: FavoriteCreate): FavoriteDto

    @GET("favorites")
    suspend fun getFavorites(): List<FavoriteDto>

    @GET("favorites/places")
    suspend fun getFavoritePlaces(): List<PlaceCardDto>

    @DELETE("favorites/{id}")
    suspend fun deleteFavorite(@Path("id") favoriteId: Int): FavoriteDto

    @POST("reviews")
    suspend fun createReview(@Body payload: ReviewCreate): ReviewDto

    @GET("reviews/{place_id}")
    suspend fun getReviews(@Path("place_id") placeId: Int): List<ReviewDto>

    @POST("itineraries/generate-itinerary")
    suspend fun generateItinerary(@Body payload: ItineraryGenerateRequest): ItineraryDto

    @GET("itineraries/itineraries")
    suspend fun getItineraries(): List<ItineraryDto>

    @POST("places")
    suspend fun createPlace(@Body payload: com.incrediblekarnataka.android.data.model.PlaceCreate): PlaceCardDto

    @POST("places/detect")
    suspend fun detectPlace(@Body payload: com.incrediblekarnataka.android.data.model.PlaceDetectRequest): com.incrediblekarnataka.android.data.model.PlaceDetectResponse

    @GET("places/pending")
    suspend fun getPendingPlaces(): List<PlaceCardDto>

    @POST("places/{id}/approve")
    suspend fun approvePlace(@Path("id") placeId: Int): PlaceCardDto

    @POST("places/{id}/reject")
    suspend fun rejectPlace(
        @Path("id") placeId: Int,
        @Body payload: com.incrediblekarnataka.android.data.model.PlaceApprovalAction
    ): PlaceCardDto

    @GET("places/photo-submissions/pending")
    suspend fun getPendingPhotoSubmissions(): List<com.incrediblekarnataka.android.data.model.PlacePhotoSubmissionDto>

    @POST("places/photo-submissions/{id}/approve")
    suspend fun approvePlacePhotoSubmission(@Path("id") submissionId: Int): com.incrediblekarnataka.android.data.model.PlacePhotoSubmissionDto

    @POST("places/photo-submissions/{id}/reject")
    suspend fun rejectPlacePhotoSubmission(
        @Path("id") submissionId: Int,
        @Body payload: com.incrediblekarnataka.android.data.model.PlaceApprovalAction
    ): com.incrediblekarnataka.android.data.model.PlacePhotoSubmissionDto

    @retrofit2.http.Multipart
    @POST("uploads/place-image")
    suspend fun uploadImage(@retrofit2.http.Part file: okhttp3.MultipartBody.Part): com.incrediblekarnataka.android.data.model.UploadResponse

    @retrofit2.http.Multipart
    @POST("uploads/place-video")
    suspend fun uploadVideo(@retrofit2.http.Part file: okhttp3.MultipartBody.Part): com.incrediblekarnataka.android.data.model.UploadResponse
}
