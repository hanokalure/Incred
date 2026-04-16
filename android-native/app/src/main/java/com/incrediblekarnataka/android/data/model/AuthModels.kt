package com.incrediblekarnataka.android.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class SignupRequest(
    val name: String,
    val email: String,
    val password: String
)

@Serializable
data class AuthResponse(
    @SerialName("access_token") val accessToken: String,
    val user: UserDto
)

@Serializable
data class UserDto(
    val id: String? = null,
    val name: String? = null,
    val email: String? = null,
    val role: String? = null
)
