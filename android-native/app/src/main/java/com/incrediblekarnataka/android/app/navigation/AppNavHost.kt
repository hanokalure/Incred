package com.incrediblekarnataka.android.app.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavType
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.navArgument
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.incrediblekarnataka.android.SessionState
import com.incrediblekarnataka.android.LoginViewModel
import com.incrediblekarnataka.android.RegisterViewModel
import com.incrediblekarnataka.android.app.ui.screens.AuthScreen
import com.incrediblekarnataka.android.app.ui.screens.DiscoverScreen
import com.incrediblekarnataka.android.app.ui.screens.HomeScreen
import com.incrediblekarnataka.android.app.ui.screens.MapScreen
import com.incrediblekarnataka.android.app.ui.screens.MainShell
import com.incrediblekarnataka.android.app.ui.screens.OnboardingScreen
import com.incrediblekarnataka.android.app.ui.screens.PlaceDetailsScreen
import com.incrediblekarnataka.android.app.ui.screens.ProfileScreen
import com.incrediblekarnataka.android.app.ui.screens.RegisterScreen
import com.incrediblekarnataka.android.app.ui.screens.SavedScreen
import com.incrediblekarnataka.android.app.ui.screens.SplashScreen
import com.incrediblekarnataka.android.app.ui.screens.TripsScreen
import com.incrediblekarnataka.android.app.ui.screens.SubmissionViewModel
import com.incrediblekarnataka.android.app.ui.screens.SubmissionUiState
import com.incrediblekarnataka.android.app.ui.screens.AdminViewModel
import com.incrediblekarnataka.android.app.ui.screens.AdminUiState
import com.incrediblekarnataka.android.app.ui.screens.SubmissionScreen
import com.incrediblekarnataka.android.app.ui.screens.AdminDashboardScreen
import com.incrediblekarnataka.android.app.ui.screens.HomeViewModel
import com.incrediblekarnataka.android.app.ui.screens.HomeUiState
import androidx.compose.runtime.collectAsState


@Composable
fun AppNavHost(sessionState: SessionState) {
    val navController = rememberNavController()
    val currentRoute by navController.currentBackStackEntryAsState()

    LaunchedEffect(sessionState) {
        when (sessionState) {
            SessionState.Loading -> Unit
            SessionState.SignedOut -> {
                navController.navigate(AppDestination.Onboarding.route) {
                    popUpTo(navController.graph.findStartDestination().id) { inclusive = true }
                    launchSingleTop = true
                }
            }
            SessionState.SignedIn -> {
                navController.navigate(AppDestination.Home.route) {
                    popUpTo(navController.graph.findStartDestination().id) { inclusive = true }
                    launchSingleTop = true
                }
            }
        }
    }

    NavHost(navController = navController, startDestination = AppDestination.Splash.route) {
        composable(AppDestination.Splash.route) { SplashScreen() }
        composable(AppDestination.Onboarding.route) {
            OnboardingScreen(
                onPrimary = { navController.navigate(AppDestination.Login.route) },
                onSecondary = { navController.navigate(AppDestination.Register.route) }
            )
        }
        composable(AppDestination.Login.route) {
            val viewModel: LoginViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            AuthScreen(
                uiState = uiState,
                onPrimary = viewModel::login,
                onSecondary = {
                    viewModel.clearError()
                    navController.navigate(AppDestination.Register.route)
                }
            )
        }
        composable(AppDestination.Register.route) {
            val viewModel: RegisterViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            RegisterScreen(
                uiState = uiState,
                onPrimary = viewModel::signup,
                onSecondary = {
                    viewModel.clearError()
                    navController.popBackStack()
                }
            )
        }
        composable(AppDestination.Home.route) {
            val profileViewModel: com.incrediblekarnataka.android.app.ui.screens.ProfileViewModel = hiltViewModel()
            val homeViewModel: HomeViewModel = hiltViewModel()
            val user by profileViewModel.user.collectAsStateWithLifecycle()
            val homeUiState by homeViewModel.uiState.collectAsStateWithLifecycle()
            
            MainShell(currentRoute = currentRoute?.destination?.route, navController = navController) {
                HomeScreen(
                    userName = user?.name,
                    uiState = homeUiState,
                    onMapClick = { navController.navigate(AppDestination.Map.route) },
                    onDiscoverClick = { navController.navigate(AppDestination.Discover.route) },
                    onPlaceClick = { placeId ->
                        navController.navigate(AppDestination.PlaceDetails.createRoute(placeId))
                    }
                )
            }
        }
        composable(AppDestination.Discover.route) {
            val viewModel: com.incrediblekarnataka.android.app.ui.screens.DiscoverViewModel = hiltViewModel()
            val discoverState by viewModel.uiState.collectAsStateWithLifecycle()
            
            MainShell(currentRoute = currentRoute?.destination?.route, navController = navController) {
                DiscoverScreen(
                    uiState = discoverState,
                    onCategorySelect = viewModel::selectCategory,
                    onDistrictSelect = viewModel::selectDistrict,
                    onToggleFavorite = viewModel::toggleFavorite,
                    onPlaceClick = { placeId ->
                        navController.navigate(AppDestination.PlaceDetails.createRoute(placeId.toString()))
                    }
                )
            }
        }
        composable(
            route = AppDestination.PlaceDetails.route,
            arguments = listOf(navArgument("placeId") { type = NavType.StringType })
        ) {
            val viewModel: com.incrediblekarnataka.android.app.ui.screens.PlaceDetailsViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()

            PlaceDetailsScreen(
                uiState = uiState,
                onBack = { navController.navigateUp() },
                onToggleSave = viewModel::toggleSave,
                onReadReviews = { viewModel.showReviewBottomSheet(true) },
                onDismissReviews = { viewModel.showReviewBottomSheet(false) },
                onSubmitReview = viewModel::submitReview
            )
        }
        composable(AppDestination.Map.route) {
            val viewModel: com.incrediblekarnataka.android.app.ui.screens.MapViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            
            MainShell(currentRoute = currentRoute?.destination?.route, navController = navController) {
                MapScreen(
                    uiState = uiState,
                    onCategorySelect = viewModel::selectCategory,
                    onPlaceClick = { placeId ->
                        navController.navigate(AppDestination.PlaceDetails.createRoute(placeId.toString()))
                    }
                )
            }
        }
        composable(AppDestination.Itinerary.route) {
            val viewModel: com.incrediblekarnataka.android.app.ui.screens.ItineraryViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            
            MainShell(currentRoute = currentRoute?.destination?.route, navController = navController) {
                com.incrediblekarnataka.android.app.ui.screens.TripsScreen(
                    uiState = uiState,
                    onNewTrip = { navController.navigate("create_itinerary") },
                    onTripClick = { tripId -> navController.navigate("day_plan/$tripId") }
                )
            }
        }
        composable("create_itinerary") {
            val viewModel: com.incrediblekarnataka.android.app.ui.screens.ItineraryViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            com.incrediblekarnataka.android.app.ui.screens.CreateItineraryScreen(
                uiState = uiState,
                onBack = { navController.navigateUp() },
                onGenerate = { distId, days, cat ->
                    viewModel.generateItinerary(distId, days, cat) { newTripId ->
                        navController.navigate("day_plan/$newTripId") {
                            popUpTo("create_itinerary") { inclusive = true }
                        }
                    }
                }
            )
        }
        composable(
            route = "day_plan/{tripId}",
            arguments = listOf(navArgument("tripId") { type = NavType.IntType })
        ) { backStackEntry ->
            val viewModel: com.incrediblekarnataka.android.app.ui.screens.ItineraryViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            com.incrediblekarnataka.android.app.ui.screens.DayPlanScreen(
                itineraryId = backStackEntry.arguments?.getInt("tripId") ?: 0,
                uiState = uiState,
                onBack = { navController.navigateUp() }
            )
        }
        composable(AppDestination.Saved.route) {
            val viewModel: com.incrediblekarnataka.android.app.ui.screens.SavedViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            
            MainShell(currentRoute = currentRoute?.destination?.route, navController = navController) {
                SavedScreen(
                    uiState = uiState,
                    onToggleFavorite = viewModel::toggleFavorite,
                    onPlaceClick = { placeId ->
                        navController.navigate(AppDestination.PlaceDetails.createRoute(placeId.toString()))
                    }
                )
            }
        }
        composable(AppDestination.Profile.route) {
            val viewModel: com.incrediblekarnataka.android.app.ui.screens.ProfileViewModel = hiltViewModel()
            val user by viewModel.user.collectAsStateWithLifecycle()
            val savedCount by viewModel.savedCount.collectAsStateWithLifecycle()
            val tripsCount by viewModel.tripsCount.collectAsStateWithLifecycle()
            
            MainShell(currentRoute = currentRoute?.destination?.route, navController = navController) {
                ProfileScreen(
                    user = user,
                    savedCount = savedCount,
                    tripsCount = tripsCount,
                    onLogoutClick = {
                        viewModel.logout()
                        navController.navigate(AppDestination.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onAddPlaceClick = { navController.navigate(AppDestination.Submission.route) },
                    onAdminClick = { navController.navigate(AppDestination.Admin.route) }
                )
            }
        }
        composable(AppDestination.Submission.route) {
            val viewModel: SubmissionViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            SubmissionScreen(
                uiState = uiState,
                onFieldChange = viewModel::onFieldChange,
                onMediaPick = viewModel::uploadMedia,
                onSubmit = viewModel::submit,
                onBack = { navController.navigateUp() }
            )
        }
        composable(AppDestination.Admin.route) {
            val viewModel: AdminViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            AdminDashboardScreen(
                uiState = uiState,
                onApprove = viewModel::approve,
                onReject = viewModel::reject,
                onApprovePhoto = viewModel::approvePhoto,
                onRejectPhoto = viewModel::rejectPhoto,
                onBack = { navController.navigateUp() }
            )
        }
    }
}
