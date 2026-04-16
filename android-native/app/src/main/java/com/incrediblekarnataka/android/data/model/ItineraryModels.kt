package com.incrediblekarnataka.android.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ItineraryGenerateRequest(
    @SerialName("district_id") val districtId: Int,
    val days: Int,
    val categories: List<String>? = null
)

@Serializable
data class ItineraryDto(
    val id: Int,
    @SerialName("user_id") val userId: String,
    @SerialName("district_id") val districtId: Int,
    val days: Int,
    val plan: String,
    @SerialName("created_at") val createdAt: String
)
