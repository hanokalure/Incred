package com.incrediblekarnataka.android.data.auth

import com.incrediblekarnataka.android.data.model.LoginRequest
import com.incrediblekarnataka.android.data.model.SignupRequest
import com.incrediblekarnataka.android.data.model.UserDto
import com.incrediblekarnataka.android.data.remote.IkApiService
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: IkApiService,
    private val authPreferences: AuthPreferences
) {
    suspend fun login(email: String, password: String): UserDto {
        val response = apiService.login(
            LoginRequest(
                email = email.trim(),
                password = password
            )
        )
        authPreferences.saveToken(response.accessToken)
        return response.user
    }

    suspend fun signup(name: String, email: String, password: String): UserDto {
        val response = apiService.signup(
            SignupRequest(
                name = name.trim(),
                email = email.trim(),
                password = password
            )
        )
        authPreferences.saveToken(response.accessToken)
        return response.user
    }

    suspend fun fetchMe(): UserDto = apiService.fetchMe()

    suspend fun clearSession() {
        authPreferences.clearSession()
    }
}
