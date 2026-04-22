package com.incrediblekarnataka.android.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.incrediblekarnataka.android.data.auth.AuthRepository
import com.incrediblekarnataka.android.data.model.UserDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val ikRepository: com.incrediblekarnataka.android.data.repository.IkRepository
) : ViewModel() {

    private val _user = MutableStateFlow<UserDto?>(null)
    val user: StateFlow<UserDto?> = _user.asStateFlow()

    private val _savedCount = MutableStateFlow(0)
    val savedCount: StateFlow<Int> = _savedCount.asStateFlow()

    private val _tripsCount = MutableStateFlow(0)
    val tripsCount: StateFlow<Int> = _tripsCount.asStateFlow()

    init {
        fetchUser()
        fetchStats()
    }

    private fun fetchUser() {
        viewModelScope.launch {
            runCatching {
                authRepository.fetchMe()
            }.onSuccess { userDto ->
                _user.value = userDto
            }
        }
    }

    private fun fetchStats() {
        viewModelScope.launch {
            try {
                val faves = ikRepository.getFavoritePlaces()
                _savedCount.value = faves.size
            } catch (e: Exception) { }

            try {
                val trips = ikRepository.getItineraries()
                _tripsCount.value = trips.size
            } catch (e: Exception) { }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.clearSession()
        }
    }
}
