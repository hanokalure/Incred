package com.incrediblekarnataka.android

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.incrediblekarnataka.android.data.auth.AuthRepository
import com.incrediblekarnataka.android.data.auth.AuthPreferences
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

@HiltViewModel
class MainViewModel @Inject constructor(
    private val authPreferences: AuthPreferences,
    private val authRepository: AuthRepository
) : ViewModel() {
    private val _sessionState = MutableStateFlow(SessionState.Loading)
    val sessionState: StateFlow<SessionState> = _sessionState.asStateFlow()

    init {
        viewModelScope.launch {
            authPreferences.authToken.collectLatest { token ->
                if (token.isNullOrBlank()) {
                    _sessionState.value = SessionState.SignedOut
                } else {
                    _sessionState.value = SessionState.Loading
                    val isValidSession = runCatching { authRepository.fetchMe() }.isSuccess
                    if (isValidSession) {
                        _sessionState.value = SessionState.SignedIn
                    } else {
                        authRepository.clearSession()
                        _sessionState.value = SessionState.SignedOut
                    }
                }
            }
        }
    }
}

enum class SessionState {
    Loading,
    SignedOut,
    SignedIn
}
