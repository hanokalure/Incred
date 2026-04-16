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
                val list = repository.getPendingPlaces()
                _uiState.update { it.copy(pendingPlaces = list, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, errorMessage = "Failed to load pending places: ${e.message}") }
            }
        }
    }

    fun approve(placeId: Int) {
        viewModelScope.launch {
            try {
                repository.approvePlace(placeId)
                // Remove from local list
                _uiState.update { it.copy(pendingPlaces = it.pendingPlaces.filter { p -> p.id != placeId }) }
            } catch (e: Exception) {
                _uiState.update { it.copy(errorMessage = "Approval failed: ${e.message}") }
            }
        }
    }
}
