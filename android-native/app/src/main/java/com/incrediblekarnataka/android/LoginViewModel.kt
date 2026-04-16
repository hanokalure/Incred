package com.incrediblekarnataka.android

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.incrediblekarnataka.android.app.ui.auth.AuthFormState
import com.incrediblekarnataka.android.data.auth.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import retrofit2.HttpException

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(AuthFormState())
    val uiState: StateFlow<AuthFormState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = AuthFormState(errorMessage = "Email and password are required.")
            return
        }

        viewModelScope.launch {
            _uiState.value = AuthFormState(isLoading = true)
            runCatching {
                authRepository.login(email = email, password = password)
            }.onSuccess {
                _uiState.value = AuthFormState()
            }.onFailure { throwable ->
                _uiState.value = AuthFormState(errorMessage = throwable.toReadableMessage())
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}

private fun Throwable.toReadableMessage(): String {
    return when (this) {
        is HttpException -> "Request failed with ${code()}. Check your credentials and backend response."
        else -> message ?: "Unable to complete login right now."
    }
}
