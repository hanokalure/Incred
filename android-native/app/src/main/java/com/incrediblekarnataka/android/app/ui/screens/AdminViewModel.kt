package com.incrediblekarnataka.android.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.incrediblekarnataka.android.data.model.PlaceCardDto
import com.incrediblekarnataka.android.data.repository.IkRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminUiState(
    val pendingPlaces: List<PlaceCardDto> = emptyList(),
    val pendingPhotoSubmissions: List<com.incrediblekarnataka.android.data.model.PlacePhotoSubmissionDto> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)


@HiltViewModel
class AdminViewModel @Inject constructor(
    private val repository: IkRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AdminUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadPendingPlaces()
    }

    fun loadPendingPlaces() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val placesResult = repository.getPendingPlaces()
                val photosResult = repository.getPendingPhotoSubmissions()
                _uiState.update { 
                    it.copy(
                        pendingPlaces = placesResult, 
                        pendingPhotoSubmissions = photosResult,
                        isLoading = false
                    ) 
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, errorMessage = "Failed to load pending items: ${e.message}") }
            }
        }
    }

    fun approve(placeId: Int) {
        viewModelScope.launch {
            try {
                repository.approvePlace(placeId)
                _uiState.update { it.copy(pendingPlaces = it.pendingPlaces.filter { p -> p.id != placeId }) }
            } catch (e: Exception) {
                _uiState.update { it.copy(errorMessage = "Approval failed: ${e.message}") }
            }
        }
    }

    fun reject(placeId: Int, reason: String?) {
        viewModelScope.launch {
            try {
                repository.rejectPlace(placeId, reason)
                _uiState.update { it.copy(pendingPlaces = it.pendingPlaces.filter { p -> p.id != placeId }) }
            } catch (e: Exception) {
                _uiState.update { it.copy(errorMessage = "Rejection failed: ${e.message}") }
            }
        }
    }

    fun approvePhoto(submissionId: Int) {
        viewModelScope.launch {
            try {
                repository.approvePlacePhotoSubmission(submissionId)
                _uiState.update { it.copy(pendingPhotoSubmissions = it.pendingPhotoSubmissions.filter { p -> p.id != submissionId }) }
            } catch (e: Exception) {
                _uiState.update { it.copy(errorMessage = "Photo Approval failed: ${e.message}") }
            }
        }
    }

    fun rejectPhoto(submissionId: Int, reason: String?) {
        viewModelScope.launch {
            try {
                repository.rejectPlacePhotoSubmission(submissionId, reason)
                _uiState.update { it.copy(pendingPhotoSubmissions = it.pendingPhotoSubmissions.filter { p -> p.id != submissionId }) }
            } catch (e: Exception) {
                _uiState.update { it.copy(errorMessage = "Photo Rejection failed: ${e.message}") }
            }
        }
    }
}
