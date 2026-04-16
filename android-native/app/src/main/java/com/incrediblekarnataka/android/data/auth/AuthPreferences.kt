package com.incrediblekarnataka.android.data.auth

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map

private val Context.authDataStore by preferencesDataStore(name = "auth_preferences")

@Singleton
class AuthPreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val tokenKey = stringPreferencesKey("token")

    val authToken: Flow<String?> = context.authDataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { prefs -> prefs[tokenKey] }

    suspend fun getToken(): String? = authToken.firstOrNull()

    suspend fun saveToken(token: String) {
        context.authDataStore.edit { prefs ->
            prefs[tokenKey] = token
        }
    }

    suspend fun clearSession() {
        context.authDataStore.edit { prefs ->
            prefs.clear()
        }
    }
}
