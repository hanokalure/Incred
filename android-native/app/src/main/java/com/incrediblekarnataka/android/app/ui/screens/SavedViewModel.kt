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

data class SavedUiState(
    val savedPlaces: List<PlaceCardDto> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class SavedViewModel @Inject constructor(
    private val repository: IkRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SavedUiState())
    val uiState: StateFlow<SavedUiState> = _uiState.asStateFlow()

    init {
        loadSavedPlaces()
    }

    fun loadSavedPlaces() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching {
                repository.getFavoritePlaces()
            }.onSuccess { places ->
                _uiState.update { it.copy(savedPlaces = places, isLoading = false) }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
            }
        }
    }

    fun toggleFavorite(placeId: Int) {
        viewModelScope.launch {
            try {
                val favs = repository.getFavorites()
                val fav = favs.find { it.placeId == placeId }
                if (fav != null) {
                    repository.deleteFavorite(fav.id)
                    // Optimistic update: remove from list
                    _uiState.update { it.copy(savedPlaces = it.savedPlaces.filter { p -> p.id != placeId }) }
                }
            } catch (e: Exception) {
                // Ignore or handle
            }
        }
    }
}
