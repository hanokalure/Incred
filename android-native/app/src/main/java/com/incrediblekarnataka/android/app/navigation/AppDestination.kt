package com.incrediblekarnataka.android.app.navigation

sealed class AppDestination(val route: String) {
    data object Splash : AppDestination("splash")
    data object Onboarding : AppDestination("onboarding")
    data object Login : AppDestination("login")
    data object Register : AppDestination("register")
    data object Home : AppDestination("home")
    data object Discover : AppDestination("discover")
    data object Map : AppDestination("map")
    data object Itinerary : AppDestination("itinerary")
    data object Saved : AppDestination("saved")
    data object Profile : AppDestination("profile")
    data object Submission : AppDestination("submission")
    data object Admin : AppDestination("admin")
    data object PlaceDetails : AppDestination("place/{placeId}") {
        fun createRoute(placeId: String): String = "place/$placeId"
    }
}
