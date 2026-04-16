package com.incrediblekarnataka.android.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.incrediblekarnataka.android.data.model.DistrictDto
import com.incrediblekarnataka.android.data.model.PlaceCardDto
import com.incrediblekarnataka.android.data.repository.IkRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DiscoverUiState(
    val places: List<PlaceCardDto> = emptyList(),
    val districts: List<DistrictDto> = emptyList(),
    val favoritePlaceIds: Set<Int> = emptySet(),
    val selectedCategory: String = "All",
    val selectedDistrictId: Int? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class DiscoverViewModel @Inject constructor(
    private val repository: IkRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DiscoverUiState())
    val uiState: StateFlow<DiscoverUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching {
                val dist = repository.fetchDistricts()
                val places = repository.fetchPlaces(
                    category = _uiState.value.selectedCategory,
                    districtId = _uiState.value.selectedDistrictId
                )
                val favs = try { repository.getFavorites() } catch(e: Exception) { emptyList() }
                Triple(dist, places, favs)
            }.onSuccess { (dist, places, favs) ->
                _uiState.update { it.copy(
                    districts = dist, 
                    places = places, 
                    favoritePlaceIds = favs.map { it.placeId }.toSet(),
                    isLoading = false
                ) }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
            }
        }
    }

    fun toggleFavorite(placeId: Int) {
        val wasFav = _uiState.value.favoritePlaceIds.contains(placeId)
        
        // OPTIMISTIC UPDATE: Immediate UI feedback
        _uiState.update { 
            it.copy(favoritePlaceIds = if (wasFav) it.favoritePlaceIds - placeId else it.favoritePlaceIds + placeId) 
        }

        viewModelScope.launch {
            try {
                if (wasFav) {
                    val favs = repository.getFavorites()
                    val fav = favs.find { it.placeId == placeId }
                    if (fav != null) {
                        repository.deleteFavorite(fav.id)
                    }
                } else {
                    repository.createFavorite(placeId)
                }
            } catch (e: Exception) {
                // ROLLBACK on failure
                _uiState.update { 
                    it.copy(favoritePlaceIds = if (wasFav) it.favoritePlaceIds + placeId else it.favoritePlaceIds - placeId)
                }
            }
        }
    }

    fun selectCategory(category: String) {
        updateFilters(category = category, districtId = _uiState.value.selectedDistrictId)
    }
    
    fun selectDistrict(districtId: Int?) {
        updateFilters(category = _uiState.value.selectedCategory, districtId = districtId)
    }

    private fun updateFilters(category: String, districtId: Int?) {
        _uiState.update { 
            it.copy(selectedCategory = category, selectedDistrictId = districtId, isLoading = true) 
        }
        viewModelScope.launch {
            runCatching {
                repository.fetchPlaces(category = category, districtId = districtId)
            }.onSuccess { places ->
                _uiState.update { it.copy(places = places, isLoading = false) }
            }.onFailure {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }
}
