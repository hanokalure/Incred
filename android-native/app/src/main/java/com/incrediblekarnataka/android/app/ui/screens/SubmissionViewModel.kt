package com.incrediblekarnataka.android.app.ui.screens

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.incrediblekarnataka.android.data.model.DistrictDto
import com.incrediblekarnataka.android.data.model.RestaurantDetailsDto
import com.incrediblekarnataka.android.data.model.StayDetailsDto
import com.incrediblekarnataka.android.data.repository.IkRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

data class SubmissionUiState(
    val name: String = "",
    val category: String = "tourist_place",
    val description: String = "",
    val districtId: Int? = null,
    val address: String = "",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val cuisines: String = "",
    val priceRange: String = "",
    val mustTry: String = "",
    val stayType: String = "",
    val pricePerNight: String = "",
    val amenities: String = "",
    val districts: List<DistrictDto> = emptyList(),
    val imageUrls: List<String> = emptyList(),
    val videoUrls: List<String> = emptyList(),
    val isLoading: Boolean = false,
    val isUploading: Boolean = false,
    val errorMessage: String? = null,
    val isSubmitted: Boolean = false
)

@HiltViewModel
class SubmissionViewModel @Inject constructor(
    private val repository: IkRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubmissionUiState())
    val uiState = _uiState.asStateFlow()

    init {
        fetchDistricts()
    }

    private fun fetchDistricts() {
        viewModelScope.launch {
            try {
                val dists = repository.fetchDistricts()
                _uiState.update { it.copy(districts = dists) }
            } catch (e: Exception) {
                _uiState.update { it.copy(errorMessage = "Failed to load districts") }
            }
        }
    }

    fun onFieldChange(
        name: String? = null,
        category: String? = null,
        description: String? = null,
        districtId: Int? = null,
        address: String? = null,
        cuisines: String? = null,
        priceRange: String? = null,
        mustTry: String? = null,
        stayType: String? = null,
        pricePerNight: String? = null,
        amenities: String? = null
    ) {
        _uiState.update {
            it.copy(
                name = name ?: it.name,
                category = category ?: it.category,
                description = description ?: it.description,
                districtId = districtId ?: it.districtId,
                address = address ?: it.address,
                cuisines = cuisines ?: it.cuisines,
                priceRange = priceRange ?: it.priceRange,
                mustTry = mustTry ?: it.mustTry,
                stayType = stayType ?: it.stayType,
                pricePerNight = pricePerNight ?: it.pricePerNight,
                amenities = amenities ?: it.amenities
            )
        }
    }

    fun uploadMedia(uri: Uri, isVideo: Boolean) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUploading = true, errorMessage = null) }
            try {
                val file = uriToFile(uri, context)
                val requestFile = file.asRequestBody(if (isVideo) "video/*".toMediaTypeOrNull() else "image/*".toMediaTypeOrNull())
                val part = MultipartBody.Part.createFormData("file", file.name, requestFile)
                
                val response = if (isVideo) repository.uploadVideo(part) else repository.uploadImage(part)
                
                _uiState.update { 
                    if (isVideo) it.copy(videoUrls = it.videoUrls + response.publicUrl, isUploading = false)
                    else it.copy(imageUrls = it.imageUrls + response.publicUrl, isUploading = false)
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isUploading = false, errorMessage = "Upload failed: ${e.message}") }
            }
        }
    }

    fun submit() {
        val state = _uiState.value
        if (state.name.isBlank() || state.districtId == null) {
            _uiState.update { it.copy(errorMessage = "Name and District are required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val restaurantDetails = if (state.category == "restaurant") {
                    RestaurantDetailsDto(
                        cuisine = state.cuisines.ifBlank { null },
                        priceRange = state.priceRange.ifBlank { null },
                        mustTry = state.mustTry.ifBlank { null }
                    )
                } else null

                val stayDetails = if (state.category == "stay") {
                    StayDetailsDto(
                        stayType = state.stayType.ifBlank { null },
                        pricePerNight = state.pricePerNight.toDoubleOrNull(),
                        amenities = state.amenities.split(",").map { it.trim() }.filter { it.isNotBlank() }
                    )
                } else null

                repository.createPlace(
                    name = state.name,
                    category = state.category,
                    districtId = state.districtId,
                    description = state.description.ifBlank { null },
                    address = state.address.ifBlank { null },
                    lat = state.latitude,
                    lng = state.longitude,
                    imageUrls = state.imageUrls,
                    videoUrls = state.videoUrls,
                    restaurantDetails = restaurantDetails,
                    stayDetails = stayDetails
                )
                _uiState.update { it.copy(isLoading = false, isSubmitted = true) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, errorMessage = "Submission failed: ${e.message}") }
            }
        }
    }

    private fun uriToFile(uri: Uri, context: Context): File {
        val inputStream = context.contentResolver.openInputStream(uri) ?: throw Exception("Cannot open URI")
        val file = File(context.cacheDir, "upload_${System.currentTimeMillis()}")
        val outputStream = FileOutputStream(file)
        inputStream.use { input -> outputStream.use { output -> input.copyTo(output) } }
        return file
    }
}
