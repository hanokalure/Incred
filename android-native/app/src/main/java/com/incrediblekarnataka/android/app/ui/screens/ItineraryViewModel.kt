package com.incrediblekarnataka.android.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.incrediblekarnataka.android.data.model.DistrictDto
import com.incrediblekarnataka.android.data.model.ItineraryDto
import com.incrediblekarnataka.android.data.repository.IkRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray

data class ItinerariesUiState(
    val itineraries: List<ItineraryDto> = emptyList(),
    val districts: List<DistrictDto> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class ItineraryViewModel @Inject constructor(
    private val repository: IkRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ItinerariesUiState())
    val uiState: StateFlow<ItinerariesUiState> = _uiState.asStateFlow()

    init {
        loadItineraries()
        loadDistricts()
    }

    fun loadItineraries() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val list = repository.getItineraries()
                _uiState.update { it.copy(itineraries = list, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
            }
        }
    }

    fun loadDistricts() {
        viewModelScope.launch {
            try {
                val list = repository.fetchDistricts()
                _uiState.update { it.copy(districts = list) }
            } catch (e: Exception) {
            }
        }
    }

    fun generateItinerary(districtId: Int, days: Int, categories: List<String>?, onSuccess: (Int) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val itinerary = repository.generateItinerary(districtId, days, categories)
                _uiState.update { it.copy(isLoading = false, itineraries = listOf(itinerary) + it.itineraries) }
                onSuccess(itinerary.id)
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
            }
        }
    }
}
