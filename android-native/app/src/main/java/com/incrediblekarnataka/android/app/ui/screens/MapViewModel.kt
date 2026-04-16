package com.incrediblekarnataka.android.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.incrediblekarnataka.android.data.model.PlaceCardDto
import com.incrediblekarnataka.android.data.repository.IkRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MapUiState(
    val places: List<PlaceCardDto> = emptyList(),
    val selectedCategory: String = "All",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class MapViewModel @Inject constructor(
    private val repository: IkRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MapUiState())
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()

    init {
        loadPlaces()
    }

    private fun loadPlaces() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching {
                repository.fetchPlaces(category = _uiState.value.selectedCategory)
            }.onSuccess { places ->
                // Filter out places with no coordinates
                val validPlaces = places.filter { it.latitude != null && it.longitude != null }
                _uiState.update { it.copy(places = validPlaces, isLoading = false) }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
            }
        }
    }

    fun selectCategory(category: String) {
        _uiState.update { it.copy(selectedCategory = category, isLoading = true) }
        viewModelScope.launch {
            runCatching {
                repository.fetchPlaces(category = category)
            }.onSuccess { places ->
                val validPlaces = places.filter { it.latitude != null && it.longitude != null }
                _uiState.update { it.copy(places = validPlaces, isLoading = false) }
            }.onFailure {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }
}
