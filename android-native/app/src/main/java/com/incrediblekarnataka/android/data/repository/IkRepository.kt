package com.incrediblekarnataka.android.data.repository

import com.incrediblekarnataka.android.data.model.DistrictDto
import com.incrediblekarnataka.android.data.model.FavoriteCreate
import com.incrediblekarnataka.android.data.model.FavoriteDto
import com.incrediblekarnataka.android.data.model.ItineraryDto
import com.incrediblekarnataka.android.data.model.ItineraryGenerateRequest
import com.incrediblekarnataka.android.data.model.PlaceCardDto
import com.incrediblekarnataka.android.data.model.ReviewCreate
import com.incrediblekarnataka.android.data.model.ReviewDto
import com.incrediblekarnataka.android.data.remote.IkApiService
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class IkRepository @Inject constructor(
    private val apiService: IkApiService
) {
    suspend fun fetchPlaces(category: String? = null, districtId: Int? = null): List<PlaceCardDto> {
        val cat = if (category == "All" || category.isNullOrBlank()) null else category.lowercase()
        return apiService.fetchPlaces(category = cat, districtId = districtId)
    }

    suspend fun fetchPlaceDetails(placeId: Int): PlaceCardDto {
        return apiService.fetchPlaceDetails(placeId)
    }

    suspend fun fetchDistricts(): List<DistrictDto> {
        return apiService.fetchDistricts()
    }

    suspend fun createFavorite(placeId: Int): FavoriteDto {
        return apiService.createFavorite(FavoriteCreate(placeId))
    }

    suspend fun getFavorites(): List<FavoriteDto> {
        return apiService.getFavorites()
    }

    suspend fun getFavoritePlaces(): List<PlaceCardDto> {
        return apiService.getFavoritePlaces()
    }

    suspend fun deleteFavorite(favoriteId: Int): FavoriteDto {
        return apiService.deleteFavorite(favoriteId)
    }

    suspend fun createReview(placeId: Int, rating: Int, comment: String?): ReviewDto {
        return apiService.createReview(ReviewCreate(placeId, rating, comment))
    }

    suspend fun getReviews(placeId: Int): List<ReviewDto> {
        return apiService.getReviews(placeId)
    }

    suspend fun generateItinerary(districtId: Int, days: Int, categories: List<String>?): ItineraryDto {
        return apiService.generateItinerary(ItineraryGenerateRequest(districtId, days, categories))
    }

    suspend fun getItineraries(): List<ItineraryDto> {
        return apiService.getItineraries()
    }

    suspend fun createPlace(
        name: String, 
        category: String, 
        districtId: Int, 
        description: String?, 
        address: String?, 
        lat: Double?, 
        lng: Double?,
        imageUrls: List<String>? = null,
        videoUrls: List<String>? = null,
        restaurantDetails: com.incrediblekarnataka.android.data.model.RestaurantDetailsDto? = null,
        stayDetails: com.incrediblekarnataka.android.data.model.StayDetailsDto? = null
    ): PlaceCardDto {
        return apiService.createPlace(com.incrediblekarnataka.android.data.model.PlaceCreate(
            name, category, districtId, address, description, lat, lng, imageUrls, videoUrls, restaurantDetails, stayDetails
        ))
    }

    suspend fun uploadImage(filePart: okhttp3.MultipartBody.Part): com.incrediblekarnataka.android.data.model.UploadResponse {
        return apiService.uploadImage(filePart)
    }

    suspend fun uploadVideo(filePart: okhttp3.MultipartBody.Part): com.incrediblekarnataka.android.data.model.UploadResponse {
        return apiService.uploadVideo(filePart)
    }

    suspend fun detectPlace(imageBase64: String): com.incrediblekarnataka.android.data.model.PlaceDetectResponse {
        return apiService.detectPlace(com.incrediblekarnataka.android.data.model.PlaceDetectRequest(imageBase64))
    }

    suspend fun getPendingPlaces(): List<PlaceCardDto> {
        return apiService.getPendingPlaces()
    }

    suspend fun approvePlace(placeId: Int): PlaceCardDto {
        return apiService.approvePlace(placeId)
    }

    suspend fun rejectPlace(placeId: Int, reason: String?): PlaceCardDto {
        return apiService.rejectPlace(placeId, com.incrediblekarnataka.android.data.model.PlaceApprovalAction(reason))
    }

    suspend fun getPendingPhotoSubmissions(): List<com.incrediblekarnataka.android.data.model.PlacePhotoSubmissionDto> {
        return apiService.getPendingPhotoSubmissions()
    }

    suspend fun approvePlacePhotoSubmission(submissionId: Int): com.incrediblekarnataka.android.data.model.PlacePhotoSubmissionDto {
        return apiService.approvePlacePhotoSubmission(submissionId)
    }

    suspend fun rejectPlacePhotoSubmission(submissionId: Int, reason: String?): com.incrediblekarnataka.android.data.model.PlacePhotoSubmissionDto {
        return apiService.rejectPlacePhotoSubmission(submissionId, com.incrediblekarnataka.android.data.model.PlaceApprovalAction(reason))
    }
}
