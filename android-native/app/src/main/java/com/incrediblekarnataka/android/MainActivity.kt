package com.incrediblekarnataka.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.hilt.navigation.compose.hiltViewModel
import com.incrediblekarnataka.android.app.navigation.AppNavHost
import com.incrediblekarnataka.android.app.ui.theme.IncredibleKarnatakaTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            IncredibleKarnatakaTheme {
                val viewModel: MainViewModel = hiltViewModel()
                val sessionState by viewModel.sessionState.collectAsState()
                AppNavHost(sessionState = sessionState)
            }
        }
    }
}
