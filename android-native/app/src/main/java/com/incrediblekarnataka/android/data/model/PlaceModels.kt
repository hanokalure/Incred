package com.incrediblekarnataka.android.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PlaceCardDto(
    val id: Int,
    val name: String,
    val category: String? = null,
    @SerialName("district_id") val districtId: Int? = null,
    @SerialName("avg_rating") val avgRating: Double? = null,
    @SerialName("image_urls") val imageUrls: List<String>? = null,
    @SerialName("video_urls") val videoUrls: List<String>? = null,
    val address: String? = null,
    val description: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @SerialName("restaurant_details") val restaurantDetails: RestaurantDetailsDto? = null,
    @SerialName("stay_details") val stayDetails: StayDetailsDto? = null
)


@Serializable
data class RestaurantDetailsDto(
    val cuisine: String? = null,
    @SerialName("price_range") val priceRange: String? = null,
    @SerialName("must_try") val mustTry: String? = null
)

@Serializable
data class StayDetailsDto(
    @SerialName("stay_type") val stayType: String? = null,
    @SerialName("price_per_night") val pricePerNight: Double? = null,
    val amenities: List<String>? = null
)

@Serializable
data class DistrictDto(
    val id: Int,
    val name: String
)

@Serializable
data class PlaceCreate(
    val name: String,
    val category: String,
    @SerialName("district_id") val districtId: Int,
    val address: String? = null,
    val description: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @SerialName("image_urls") val imageUrls: List<String>? = null,
    @SerialName("video_urls") val videoUrls: List<String>? = null,
    @SerialName("restaurant_details") val restaurantDetails: RestaurantDetailsDto? = null,
    @SerialName("stay_details") val stayDetails: StayDetailsDto? = null
)

@Serializable
data class PlaceDetectRequest(
    @SerialName("image_base64") val imageBase64: String
)

@Serializable
data class PlaceDetectResponse(
    val detected: Boolean,
    @SerialName("matched_place") val matchedPlace: PlaceCardDto? = null,
    @SerialName("confidence_score") val confidenceScore: Double? = null
)

@Serializable
data class UploadResponse(
    @SerialName("public_url") val publicUrl: String
)

@Serializable
data class PlaceApprovalAction(
    @SerialName("rejection_reason") val rejectionReason: String? = null
)

@Serializable
data class PlacePhotoSubmissionDto(
    val id: Int,
    @SerialName("place_id") val placeId: Int,
    @SerialName("place_name") val placeName: String? = null,
    @SerialName("submitted_by") val submittedBy: String,
    @SerialName("submitted_by_name") val submittedByName: String? = null,
    @SerialName("media_type") val mediaType: String,
    @SerialName("media_url") val mediaUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("video_url") val videoUrl: String? = null,
    val status: String
)
