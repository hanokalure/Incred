package com.incrediblekarnataka.android.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class FavoriteDto(
    val id: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("place_id") val placeId: Int,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class FavoriteCreate(
    @SerialName("place_id") val placeId: Int
)

@Serializable
data class ReviewDto(
    val id: Int,
    @SerialName("place_id") val placeId: Int,
    @SerialName("user_id") val userId: Int,
    val rating: Int,
    val comment: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("user_name") val userName: String? = null
)

@Serializable
data class ReviewCreate(
    @SerialName("place_id") val placeId: Int,
    val rating: Int,
    val comment: String? = null
)
