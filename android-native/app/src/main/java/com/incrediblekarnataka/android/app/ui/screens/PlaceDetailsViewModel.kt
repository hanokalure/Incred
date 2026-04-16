package com.incrediblekarnataka.android.app.ui.screens

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.incrediblekarnataka.android.data.model.FavoriteDto
import com.incrediblekarnataka.android.data.model.PlaceCardDto
import com.incrediblekarnataka.android.data.model.ReviewDto
import com.incrediblekarnataka.android.data.repository.IkRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PlaceDetailsUiState(
    val isLoading: Boolean = false,
    val place: PlaceCardDto? = null,
    val errorMessage: String? = null,
    val isSaved: Boolean = false,
    val favoriteId: Int? = null,
    val reviews: List<ReviewDto> = emptyList(),
    val isReviewBottomSheetVisible: Boolean = false
)

@HiltViewModel
class PlaceDetailsViewModel @Inject constructor(
    private val repository: IkRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    private val placeId: String = checkNotNull(savedStateHandle["placeId"])

    private val _uiState = MutableStateFlow(PlaceDetailsUiState())
    val uiState = _uiState.asStateFlow()

    init {
        fetchPlaceDetails()
        fetchFavoriteStatus()
        fetchReviews()
    }

    private fun fetchPlaceDetails() {
        if (placeId.isBlank()) return
        
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            try {
                val place = repository.fetchPlaceDetails(placeId.toInt())
                _uiState.update { it.copy(isLoading = false, place = place) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message ?: "Failed to fetch place details") }
            }
        }
    }

    private fun fetchFavoriteStatus() {
        if (placeId.isBlank()) return
        
        viewModelScope.launch {
            try {
                val favs = repository.getFavorites()
                val fav = favs.find { it.placeId == placeId.toInt() }
                if (fav != null) {
                    _uiState.update { it.copy(isSaved = true, favoriteId = fav.id) }
                }
            } catch (e: Exception) {
                // Ignore error if not logged in
            }
        }
    }

    fun toggleSave() {
        if (placeId.isBlank()) return
        val wasSaved = _uiState.value.isSaved
        val currentFavId = _uiState.value.favoriteId
        
        // OPTIMISTIC UPDATE
        _uiState.update { it.copy(isSaved = !wasSaved) }

        viewModelScope.launch {
            try {
                if (wasSaved && currentFavId != null) {
                    repository.deleteFavorite(currentFavId)
                    _uiState.update { it.copy(favoriteId = null) }
                } else if (!wasSaved) {
                    val fav = repository.createFavorite(placeId.toInt())
                    _uiState.update { it.copy(favoriteId = fav.id) }
                }
            } catch (e: Exception) {
                // ROLLBACK
                _uiState.update { it.copy(isSaved = wasSaved, errorMessage = "Failed to toggle save: ${e.message}") }
            }
        }
    }

    fun fetchReviews() {
        if (placeId.isBlank()) return
        viewModelScope.launch {
            try {
                val list = repository.getReviews(placeId.toInt())
                _uiState.update { it.copy(reviews = list) }
            } catch (e: Exception) {
                // Ignore empty or unauthenticated review reads
            }
        }
    }

    fun submitReview(rating: Int, comment: String) {
        if (placeId.isBlank() || rating == 0) return
        viewModelScope.launch {
            try {
                val newRev = repository.createReview(placeId.toInt(), rating, comment.ifBlank { null })
                _uiState.update { it.copy(reviews = listOf(newRev) + it.reviews) }
            } catch (e: Exception) {
                _uiState.update { it.copy(errorMessage = "Failed to submit review: ${e.message}") }
            }
        }
    }

    fun showReviewBottomSheet(show: Boolean) {
        _uiState.update { it.copy(isReviewBottomSheetVisible = show) }
    }
}
