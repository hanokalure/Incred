@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.incrediblekarnataka.android.app.ui.screens

import org.osmdroid.config.Configuration
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import android.preference.PreferenceManager
import androidx.compose.ui.viewinterop.AndroidView
import com.incrediblekarnataka.android.BuildConfig
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import android.content.Intent
import android.net.Uri
import com.incrediblekarnataka.android.data.model.PlaceCardDto
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.compose.runtime.DisposableEffect
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.FilterList
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.Route
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import com.incrediblekarnataka.android.app.navigation.AppDestination
import com.incrediblekarnataka.android.app.ui.auth.AuthFormState
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.animation.animateColorAsState
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.zIndex
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.LinearProgressIndicator
import com.incrediblekarnataka.android.data.model.UserDto


private val HeroBrush = Brush.verticalGradient(
    colors = listOf(
        Color(0xFFF8E7C6),
        Color(0xFFEFAE5A),
        Color(0xFF0F6B5B)
    )
)

private val SectionBrush = Brush.horizontalGradient(
    colors = listOf(
        Color(0xFFFFF4DF),
        Color(0xFFF7D39B)
    )
)

private data class BottomNavItem(
    val destination: AppDestination,
    val label: String,
    val icon: @Composable () -> Unit
)

private fun String.titlecase(): String = replaceFirstChar { it.titlecase() }

private data class DiscoverPlace(
    val id: String,
    val title: String,
    val details: String
)


private val BottomNavItems = listOf(
    BottomNavItem(
        destination = AppDestination.Home,
        label = "Home",
        icon = { androidx.compose.material3.Icon(Icons.Outlined.Home, contentDescription = "Home") }
    ),
    BottomNavItem(
        destination = AppDestination.Discover,
        label = "Discover",
        icon = { androidx.compose.material3.Icon(Icons.Outlined.Explore, contentDescription = "Discover") }
    ),
    BottomNavItem(
        destination = AppDestination.Map,
        label = "Map",
        icon = { androidx.compose.material3.Icon(Icons.Outlined.Map, contentDescription = "Map") }
    ),
    BottomNavItem(
        destination = AppDestination.Itinerary,
        label = "Trips",
        icon = { androidx.compose.material3.Icon(Icons.Outlined.Route, contentDescription = "Trips") }
    ),
    BottomNavItem(
        destination = AppDestination.Saved,
        label = "Saved",
        icon = { androidx.compose.material3.Icon(Icons.Outlined.BookmarkBorder, contentDescription = "Saved") }
    ),
    BottomNavItem(
        destination = AppDestination.Profile,
        label = "Profile",
        icon = { androidx.compose.material3.Icon(Icons.Outlined.PersonOutline, contentDescription = "Profile") }
    )
)



@Composable
fun SplashScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(HeroBrush)
            .safeDrawingPadding()
            .padding(24.dp)
    ) {
        Column(modifier = Modifier.align(Alignment.CenterStart)) {
            Text(
                text = "Incredible",
                style = MaterialTheme.typography.displayMedium,
                color = Color(0xFF143C33)
            )
            Text(
                text = "Karnataka",
                style = MaterialTheme.typography.displayLarge,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Routes, heritage, food, and stays in one clean travel app.",
                style = MaterialTheme.typography.bodyLarge,
                color = Color(0xFFFDF6E8)
            )
        }
    }
}

@Composable
fun OnboardingScreen(
    onPrimary: () -> Unit,
    onSecondary: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .safeDrawingPadding()
                .imePadding()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            HeroPanel(
                title = "Travel Karnataka with local rhythm",
                subtitle = "A modern trip planner shaped by temple towns, hill stations, coastlines, craft trails, and food streets."
            )
            FeatureStrip()
            ActionCard(
                eyebrow = "Start clean",
                title = "Build your route in minutes",
                body = "Save places, open maps quickly, and move into a focused itinerary flow without clutter."
            )
            Button(
                onClick = onPrimary,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Continue to Login")
            }
            OutlinedButton(
                onClick = onSecondary,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp)
            ) {
                Text("Create an Account")
            }
        }
    }
}

@Composable
fun AuthScreen(
    uiState: AuthFormState,
    onPrimary: (String, String) -> Unit,
    onSecondary: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .safeDrawingPadding()
                .imePadding()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            HeroPanel(
                title = "Welcome back",
                subtitle = "Jump into saved routes, local picks, and a cleaner travel dashboard."
            )
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "Login",
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Email") },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp)
                    )
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Password") },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp)
                    )
                    Button(
                        onClick = { onPrimary(email, password) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        enabled = !uiState.isLoading
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Login")
                        }
                    }
                    if (uiState.errorMessage != null) {
                        Text(
                            text = uiState.errorMessage,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    TextButton(
                        onClick = onSecondary,
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text("Create account")
                    }
                }
            }
            Spacer(modifier = Modifier.height(28.dp))
        }
    }
}

@Composable
fun RegisterScreen(
    uiState: AuthFormState,
    onPrimary: (String, String, String) -> Unit,
    onSecondary: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .safeDrawingPadding()
                .imePadding()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            HeroPanel(
                title = "Create your traveler profile",
                subtitle = "Keep it simple now. We will connect rewards, saved spots, and itinerary sync later."
            )
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Full name") },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp)
                    )
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Email") },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp)
                    )
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Password") },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp)
                    )
                    Button(
                        onClick = { onPrimary(name, email, password) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        enabled = !uiState.isLoading
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Create Account")
                        }
                    }
                    if (uiState.errorMessage != null) {
                        Text(
                            text = uiState.errorMessage,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    TextButton(onClick = onSecondary) {
                        Text("Back to login")
                    }
                }
            }
            Spacer(modifier = Modifier.height(28.dp))
        }
    }
}

@Composable
fun HomeScreen(
    userName: String? = null,
    uiState: HomeUiState,
    onMapClick: () -> Unit,
    onDiscoverClick: () -> Unit,
    onPlaceClick: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Card(
            shape = RoundedCornerShape(30.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .background(HeroBrush)
                    .padding(24.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text(
                        text = "Incredible Karnataka",
                        style = MaterialTheme.typography.displaySmall,
                        color = Color.White
                    )
                    Text(
                        text = "Bengaluru, Karnataka",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color(0xFF1D4A40)
                    )
                    Text(
                        text = "Find weekends worth leaving for directly from Hampi sunrise trails to Coorg coffee stays.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFFFFF7E8)
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(
                            onClick = onDiscoverClick,
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF143C33))
                        ) {
                            Text("Explore routes")
                        }
                        OutlinedButton(
                            onClick = onMapClick,
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("Open map")
                        }
                    }
                }
            }
        }

        SectionTitle(title = "Popular places", action = "See all")
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator()
            } else {
                uiState.popularPlaces.forEach { place ->
                    DestinationCard(
                        title = place.name,
                        subtitle = place.category?.replace("_", " ")?.capitalize() ?: "Destination",
                        accent = Color(0xFF0C7A71),
                        onClick = { onPlaceClick(place.id.toString()) }
                    )
                }
            }
        }

        SectionTitle(title = "Quick planner", action = "Customize")
        ActionRow()

        SectionTitle(title = "Featured selection", action = "Show more")
        uiState.featuredPlace?.let { featured ->
            FeaturedCard(
                eyebrow = featured.category?.replace("_", " ")?.capitalize() ?: "Featured",
                title = featured.name,
                body = featured.description ?: "Discover the essence of Karnataka through this handpicked location.",
                onClick = { onPlaceClick(featured.id.toString()) }
            )
        } ?: run {
            ActionCard(
                eyebrow = "Local culture",
                title = "Temple town mornings and market evenings",
                body = "A lighter home feed for slow travel: walkable neighborhoods, local breakfasts, and handcrafted shopping stops."
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoverScreen(
    uiState: com.incrediblekarnataka.android.app.ui.screens.DiscoverUiState,
    onCategorySelect: (String) -> Unit,
    onDistrictSelect: (Int?) -> Unit,
    onToggleFavorite: (Int) -> Unit,
    onPlaceClick: (String) -> Unit
) {
    var query by rememberSaveable { mutableStateOf("") }

    
    val filteredPlaces = uiState.places.filter { place ->
        query.isBlank() ||
            place.name.contains(query, ignoreCase = true) ||
            (place.category?.contains(query, ignoreCase = true) == true) ||
            (place.description?.contains(query, ignoreCase = true) == true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                singleLine = true,
                leadingIcon = {
                    Icon(Icons.Outlined.Search, contentDescription = "Search")
                },
                label = { Text("Search cities, trails, food, heritage") }
            )

            val categories = listOf("All", "restaurant", "stay", "generational_shop", "hidden_gem", "tourist_place")
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { category ->
                    val displayLabel = if (category == "All") "All" else category.split('_').joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }
                    FilterChip(
                        selected = uiState.selectedCategory == category,
                        onClick = { onCategorySelect(category) },
                        label = { Text(displayLabel) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                        )
                    )
                }
            }

            var districtDropdownExpanded by remember { mutableStateOf(false) }
            val currentDistrictName = uiState.districts.find { it.id == uiState.selectedDistrictId }?.name ?: "All Districts"
            
            Box {
                OutlinedButton(
                    onClick = { districtDropdownExpanded = true },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text(text = "District: $currentDistrictName")
                }
                DropdownMenu(
                    expanded = districtDropdownExpanded,
                    onDismissRequest = { districtDropdownExpanded = false },
                    modifier = Modifier.fillMaxWidth(0.9f)
                ) {
                    DropdownMenuItem(
                        text = { Text("All Districts") },
                        onClick = { 
                            onDistrictSelect(null)
                            districtDropdownExpanded = false
                        }
                    )
                    uiState.districts.forEach { district ->
                        DropdownMenuItem(
                            text = { Text(district.name) },
                            onClick = { 
                                onDistrictSelect(district.id)
                                districtDropdownExpanded = false
                            }
                        )
                    }
                }
            }

        }

        HeroPanel(
            title = "Discover Karnataka",
            subtitle = "Browse hill towns, heritage circuits, local food streets, and weekend-ready picks in one place."
        )

        if (uiState.isLoading) {
            androidx.compose.material3.CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
        } else if (uiState.errorMessage != null) {
            ActionCard(
                eyebrow = "Error",
                title = "Failed to load places",
                body = uiState.errorMessage ?: "Unknown error"
            )
        } else {
            SectionTitle(title = "Results", action = "${filteredPlaces.size} places")
            if (filteredPlaces.isEmpty()) {
                ActionCard(
                    eyebrow = "No match",
                    title = "Nothing fits this search yet",
                    body = "Try another keyword or switch the selected category filter."
                )
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    filteredPlaces.forEach { place ->
                        val formattedCategory = place.category?.split("_", "-")?.joinToString(" ") { 
                            it.replaceFirstChar { char -> if (char.isLowerCase()) char.titlecase() else char.toString() }
                        } ?: "Destination"
                        
                        FeaturedDiscoverCard(
                            title = place.name,
                            subtitle = formattedCategory,
                            accent = Color(0xFF0C7A71),
                            isSaved = uiState.favoritePlaceIds.contains(place.id),
                            onToggleFavorite = { onToggleFavorite(place.id) },
                            onClick = { onPlaceClick(place.id.toString()) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ActionCard(
    eyebrow: String,
    title: String,
    body: String
) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = eyebrow.uppercase(),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = body,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Start
            )
        }
    }
}

@Composable
fun VideoPlayer(videoUrl: String, modifier: Modifier = Modifier) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            val mediaItem = MediaItem.fromUri(videoUrl)
            setMediaItem(mediaItem)
            prepare()
        }
    }
    
    DisposableEffect(Unit) {
        onDispose { exoPlayer.release() }
    }
    
    AndroidView(
        factory = {
            PlayerView(context).apply {
                player = exoPlayer
                useController = true
                layoutParams = android.view.ViewGroup.LayoutParams(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT
                )
            }
        },
        modifier = modifier
    )
}
@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun PlaceDetailsScreen(
    uiState: com.incrediblekarnataka.android.app.ui.screens.PlaceDetailsUiState,
    onBack: () -> Unit,
    onToggleSave: () -> Unit = {},
    onReadReviews: () -> Unit = {},
    onDismissReviews: () -> Unit = {},
    onSubmitReview: (Int, String) -> Unit = { _, _ -> }
) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        val place = uiState.place
        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                androidx.compose.material3.CircularProgressIndicator()
            }
        } else if (place == null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .safeDrawingPadding()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.surface)
                ) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                }
                ActionCard(
                    eyebrow = "Missing place",
                    title = "This destination was not found",
                    body = "Go back and open another result from Discover."
                )
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .safeDrawingPadding()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.surface)
                ) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                }
                
                Text(
                    text = place.name,
                    style = MaterialTheme.typography.displaySmall,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = "${place.avgRating ?: "—"} ★  •  ${place.address ?: "Location unavailable"}",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Box(modifier = Modifier.fillMaxWidth()) {
                    if (!place.imageUrls.isNullOrEmpty()) {
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            place.imageUrls.forEach { imagePath ->
                                val url = if (imagePath.startsWith("http")) imagePath else "http://10.0.2.2:8000/files/place-images/$imagePath"
                                coil.compose.AsyncImage(
                                    model = url,
                                    contentDescription = "Place photo",
                                    modifier = Modifier
                                        .width(if (place.imageUrls.size == 1) 360.dp else 300.dp)
                                        .height(280.dp)
                                        .clip(RoundedCornerShape(16.dp)),
                                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                                )
                            }
                        }
                    }
                    
                    FavoriteToggle(
                        isSaved = uiState.isSaved,
                        onToggle = onToggleSave,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(12.dp)
                            .zIndex(10f)
                            .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                    )
                }
                
                if (!place.videoUrls.isNullOrEmpty()) {
                    Text(
                        text = "Videos",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        place.videoUrls.forEach { videoPath ->
                            val url = if (videoPath.startsWith("http")) videoPath else "http://10.0.2.2:8000/files/place-images/$videoPath"
                            VideoPlayer(
                                videoUrl = url,
                                modifier = Modifier
                                    .width(if (place.videoUrls.size == 1) 360.dp else 300.dp)
                                    .height(280.dp)
                                    .clip(RoundedCornerShape(16.dp))
                            )
                        }
                    }
                }
                
                if (place.description != null) {
                    Text(
                        text = place.description,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = androidx.compose.ui.unit.TextUnit(24f, androidx.compose.ui.unit.TextUnitType.Sp)
                    )
                } else {
                    Text(
                        text = "No description available.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                place.restaurantDetails?.let { restaurant ->
                    val lines = buildList {
                        restaurant.cuisine?.let { add("Cuisine: $it") }
                        restaurant.priceRange?.let { add("Price range: $it") }
                        restaurant.mustTry?.let { add("Must try: $it") }
                    }.joinToString("\n")
                    
                    if (lines.isNotBlank()) {
                        ActionCard(
                            eyebrow = "Dining specifics",
                            title = "What to expect",
                            body = lines
                        )
                    }
                }

                place.stayDetails?.let { stay ->
                    val lines = buildList {
                        stay.stayType?.let { add("Type: $it") }
                        stay.pricePerNight?.let { add("Price per night: $it") }
                        if (!stay.amenities.isNullOrEmpty()) {
                            add("Amenities: ${stay.amenities.joinToString(", ")}")
                        }
                    }.joinToString("\n")
                    
                    if (lines.isNotBlank()) {
                        ActionCard(
                            eyebrow = "Stay particulars",
                            title = "Checking in",
                            body = lines
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                androidx.compose.material3.OutlinedButton(
                    onClick = { /* TODO Phase 7 ITINERARY */ },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Add to Itinerary")
                }
                
                val context = androidx.compose.ui.platform.LocalContext.current
                androidx.compose.material3.TextButton(
                    onClick = {
                        if (place.latitude != null && place.longitude != null) {
                            val uri = Uri.parse("google.navigation:q=${place.latitude},${place.longitude}")
                            val intent = Intent(Intent.ACTION_VIEW, uri)
                            intent.setPackage("com.google.android.apps.maps")
                            if (intent.resolveActivity(context.packageManager) != null) {
                                context.startActivity(intent)
                            } else {
                                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}"))
                                context.startActivity(browserIntent)
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Get Directions")
                }
                androidx.compose.material3.TextButton(
                    onClick = onReadReviews,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Read Reviews")
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
    
    if (uiState.isReviewBottomSheetVisible) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        var rating by remember { mutableStateOf(5) }
        var comment by remember { mutableStateOf("") }
        
        ModalBottomSheet(
            onDismissRequest = onDismissReviews,
            sheetState = sheetState,
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .imePadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Reviews",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                // Submit Form
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    placeholder = { Text("Write a review...") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                )
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        (1..5).forEach { i ->
                            Text(
                                text = "★",
                                color = if (i <= rating) Color(0xFFEFAE5A) else Color.Gray,
                                modifier = Modifier.clickable { rating = i }.padding(4.dp),
                                style = MaterialTheme.typography.titleLarge
                            )
                        }
                    }
                    Button(
                        onClick = {
                            onSubmitReview(rating, comment)
                            comment = ""
                        },
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text("Post")
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // List of Reviews
                if (uiState.reviews.isEmpty()) {
                    Text("No reviews yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.reviews) { rev ->
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                modifier = Modifier.width(280.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                        Text(rev.userName ?: "Traveler", style = MaterialTheme.typography.titleSmall)
                                        Text("★ ${rev.rating}", color = Color(0xFFEFAE5A), style = MaterialTheme.typography.titleSmall)
                                    }
                                    if (!rev.comment.isNullOrBlank()) {
                                        Text(rev.comment, style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(
    uiState: MapUiState,
    onCategorySelect: (String) -> Unit,
    onPlaceClick: (String) -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var selectedPlace by remember { mutableStateOf<PlaceCardDto?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Category Filter Row exactly matching Discover
            val categories = listOf("All", "restaurant", "stay", "generational_shop", "hidden_gem", "tourist_place")
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { category ->
                    val displayLabel = if (category == "All") "All" else category.split('_').joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }
                    FilterChip(
                        selected = uiState.selectedCategory == category,
                        onClick = { onCategorySelect(category) },
                        label = { Text(displayLabel) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                        )
                    )
                }
            }

            // OSMDroid Map Fill
            AndroidView(
                modifier = Modifier.fillMaxWidth().weight(1f),
                factory = { ctx ->
                    Configuration.getInstance().load(ctx, PreferenceManager.getDefaultSharedPreferences(ctx))
                    Configuration.getInstance().userAgentValue = BuildConfig.APPLICATION_ID

                    MapView(ctx).apply {
                        setMultiTouchControls(true)
                        controller.setZoom(7.0)
                        controller.setCenter(GeoPoint(14.8, 75.8))
                    }
                },
                update = { mapView ->
                    mapView.overlays.clear()
                    uiState.places.forEach { place ->
                        if (place.latitude != null && place.longitude != null) {
                            val mark = Marker(mapView)
                            mark.position = GeoPoint(place.latitude, place.longitude)
                            mark.title = place.name
                            mark.snippet = place.category
                            mark.setOnMarkerClickListener { _, _ ->
                                selectedPlace = place
                                true
                            }
                            mapView.overlays.add(mark)
                        }
                    }
                    mapView.invalidate()
                }
            )
        }

        if (uiState.isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center)
            )
        }
    }

    if (selectedPlace != null) {
        ModalBottomSheet(
            onDismissRequest = { selectedPlace = null },
            sheetState = sheetState,
            containerColor = MaterialTheme.colorScheme.background
        ) {
            val place = selectedPlace!!
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = place.name,
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = "${place.avgRating ?: "—"} ★  •  ${place.category ?: "Destination"}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        modifier = Modifier.weight(1f),
                        onClick = {
                            selectedPlace = null
                            onPlaceClick(place.id.toString())
                        }
                    ) {
                        Text("View Details")
                    }
                    
                    OutlinedButton(
                        modifier = Modifier.weight(1f),
                        onClick = {
                            val uri = Uri.parse("google.navigation:q=${place.latitude},${place.longitude}")
                            val intent = Intent(Intent.ACTION_VIEW, uri)
                            intent.setPackage("com.google.android.apps.maps")
                            if (intent.resolveActivity(context.packageManager) != null) {
                                context.startActivity(intent)
                            } else {
                                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}"))
                                context.startActivity(browserIntent)
                            }
                        }
                    ) {
                        Text("Get Directions")
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun TripsScreen(
    uiState: ItinerariesUiState,
    onNewTrip: () -> Unit,
    onTripClick: (Int) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        HeroPanel(
            title = "Plan your trip",
            subtitle = "A clean AI itinerary builder routing you through the best districts."
        )

        Button(
            onClick = onNewTrip,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
        ) {
            Text("Create New Itinerary")
        }

        SectionTitle(title = "Your itineraries", action = "${uiState.itineraries.size} items")
        
        if (uiState.isLoading) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
        } else if (uiState.itineraries.isEmpty()) {
            Text("No itineraries yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                uiState.itineraries.forEach { trip ->
                    DiscoverListCard(
                        title = "Itinerary ID: #${trip.id}",
                        subtitle = "${trip.days} days experience",
                        isSaved = false,
                        onToggleFavorite = {},
                        onClick = { onTripClick(trip.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun SavedScreen(
    uiState: SavedUiState,
    onToggleFavorite: (Int) -> Unit,
    onPlaceClick: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        HeroPanel(
            title = "Saved places",
            subtitle = "Bookmarks, shortlist picks, and places you want to revisit are grouped here."
        )
        SectionTitle(title = "Your shortlist", action = "${uiState.savedPlaces.size} items")
        
        if (uiState.isLoading) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
        } else if (uiState.savedPlaces.isEmpty()) {
            Text("No saved places yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                uiState.savedPlaces.forEach { place ->
                    DiscoverListCard(
                        title = place.name, 
                        subtitle = "${place.address ?: place.category}", 
                        isSaved = true, // It's the saved screen, so all are saved
                        onToggleFavorite = { onToggleFavorite(place.id) },
                        onClick = { onPlaceClick(place.id.toString()) }
                    )
                }
            }
        }
        SectionTitle(title = "Collections", action = "New")
        ActionRow()
    }
}

@Composable
fun ProfileScreen(
    user: UserDto?,
    savedCount: Int,
    tripsCount: Int,
    onLogoutClick: () -> Unit,
    onAddPlaceClick: () -> Unit,
    onAdminClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Card(
            shape = RoundedCornerShape(30.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .background(HeroBrush)
                    .padding(24.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Traveler profile",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color(0xFF1D4A40)
                    )
                    Text(
                        text = user?.name ?: "Guest",
                        style = MaterialTheme.typography.displaySmall,
                        color = Color.White
                    )
                    Text(
                        text = "Role: ${user?.role ?: "User"}  •  ${user?.email ?: ""}",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFFFFF7E8)
                    )
                }
            }
        }
        
        SectionTitle(title = "Community Actions", action = "View")
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            androidx.compose.material3.OutlinedButton(
                onClick = onAddPlaceClick,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Add, null)
                Spacer(Modifier.width(8.dp))
                Text("Submit a New Place")
            }

            if (user?.role == "admin") {
                androidx.compose.material3.OutlinedButton(
                    onClick = onAdminClick,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary)
                ) {
                    Icon(Icons.Default.AdminPanelSettings, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Admin Dashboard")
                }
            }
        }

        SectionTitle(title = "Travel stats", action = "Overall")
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            QuickActionCard(savedCount.toString(), "Saved places")
            QuickActionCard(tripsCount.toString(), "Trips planned")
            QuickActionCard("—", "Cities explored")
        }
        

            
            Spacer(modifier = Modifier.height(18.dp))
            Button(
                onClick = onLogoutClick,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Text("Logout")
            }
        }
    }

@Composable
fun ExplorePlaceholderScreen(
    title: String,
    subtitle: String
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        HeroPanel(title = title, subtitle = subtitle)
        ActionCard(
            eyebrow = "Next build",
            title = "This section is ready for feature implementation",
            body = "The screen shell, spacing, navigation, and theme are already aligned with the new app UI."
        )
    }
}

@Composable
fun MainShell(
    currentRoute: String?,
    navController: NavHostController,
    content: @Composable () -> Unit
) {
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 0.dp
            ) {
                BottomNavItems.forEach { item ->
                    NavigationBarItem(
                        selected = currentRoute == item.destination.route,
                        onClick = {
                            navController.navigate(item.destination.route) {
                                launchSingleTop = true
                                restoreState = true
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                            }
                        },
                        icon = item.icon,
                        label = { Text(item.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.onSurface,
                            indicatorColor = MaterialTheme.colorScheme.secondaryContainer,
                            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            content()
        }
    }
}


@Composable
fun HeroPanel(
    title: String,
    subtitle: String
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.displaySmall,
            color = MaterialTheme.colorScheme.onBackground
        )
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun FeatureStrip() {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Temples", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text("•", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text("Food", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text("•", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text("Hills", color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}


@Composable
fun ActionRow() {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedButton(onClick = { /*TODO*/ }, shape = RoundedCornerShape(16.dp)) {
            Text("By Theme")
        }
        OutlinedButton(onClick = { /*TODO*/ }, shape = RoundedCornerShape(16.dp)) {
            Text("By District")
        }
    }
}

@Composable
fun DestinationCard(title: String, subtitle: String, accent: Color, onClick: () -> Unit) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = accent),
        modifier = Modifier.width(220.dp).height(240.dp).clickable { onClick() }
    ) {
        Column(
            modifier = Modifier.padding(20.dp).fillMaxSize(),
            verticalArrangement = Arrangement.Bottom
        ) {
            Text(text = title, style = MaterialTheme.typography.titleLarge, color = Color.White)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = subtitle, style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = 0.8f))
        }
    }
}

@Composable
fun FeaturedCard(
    eyebrow: String,
    title: String,
    body: String,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text(
                text = eyebrow.uppercase(),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = body,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
            )
        }
    }
}


@Composable
fun FavoriteToggle(
    isSaved: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scale by animateFloatAsState(
        targetValue = if (isSaved) 1.25f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
        label = "favScale"
    )
    
    val color by animateColorAsState(
        targetValue = if (isSaved) Color(0xFFEFAE5A) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
        label = "favColor"
    )

    IconButton(
        onClick = onToggle,
        modifier = modifier
            .zIndex(10f)
            .graphicsLayer(scaleX = scale, scaleY = scale)
    ) {
        Icon(
            imageVector = if (isSaved) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
            contentDescription = if (isSaved) "Unsave" else "Save",
            tint = if (isSaved) Color(0xFFEFAE5A) else color
        )
    }
}

@Composable
fun SectionTitle(title: String, action: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(text = title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        TextButton(onClick = { /*TODO*/ }) {
            Text(text = action)
        }
    }
}

@Composable
fun DiscoverChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val bg = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface
    val contentColor = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = bg,
        modifier = Modifier.clickable { onClick() }
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            color = contentColor,
            style = MaterialTheme.typography.labelLarge
        )
    }
}

@Composable
fun FeaturedDiscoverCard(
    title: String,
    subtitle: String,
    accent: Color,
    isSaved: Boolean,
    onToggleFavorite: () -> Unit,
    onClick: () -> Unit
) {
    Box(modifier = Modifier.fillMaxWidth()) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = accent),
            modifier = Modifier.fillMaxWidth().clickable { onClick() }
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(text = title, style = MaterialTheme.typography.titleLarge, color = Color.White)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = subtitle, style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = 0.8f))
            }
        }
        FavoriteToggle(
            isSaved = isSaved,
            onToggle = onToggleFavorite,
            modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)
        )
    }
}

@Composable
fun DiscoverListCard(
    title: String, 
    subtitle: String, 
    isSaved: Boolean,
    onToggleFavorite: () -> Unit,
    onClick: () -> Unit
) {
    Box(modifier = Modifier.fillMaxWidth()) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.fillMaxWidth().clickable { onClick() }
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(text = subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        FavoriteToggle(
            isSaved = isSaved,
            onToggle = onToggleFavorite,
            modifier = Modifier.align(Alignment.TopEnd).padding(4.dp)
        )
    }
}

@Composable
fun MapPinTag(label: String) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = Color.White.copy(alpha = 0.9f)
    ) {
        Text(text = label, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
fun TripDayCard(day: String, title: String, items: String) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = day.uppercase(), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = items, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun SavedPlaceCard(title: String, subtitle: String) {
    DiscoverListCard(title, subtitle, isSaved = true, onToggleFavorite = {}, onClick = {})
}

@Composable
fun QuickActionCard(stat: String, label: String) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.width(120.dp).height(100.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp).fillMaxSize(), verticalArrangement = Arrangement.Center) {
            Text(text = stat, style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun CreateItineraryScreen(
    uiState: ItinerariesUiState,
    onGenerate: (Int, Int, List<String>) -> Unit,
    onBack: () -> Unit
) {
    var expandedDistrict by remember { mutableStateOf(false) }
    var selectedDistrictId by remember { mutableStateOf<Int?>(null) }
    var days by remember { mutableStateOf("2") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back") }
            Spacer(modifier = Modifier.width(8.dp))
            Text("Create AI Itinerary", style = MaterialTheme.typography.titleLarge)
        }

        Text("Select a district to focus your trip on:")
        Box {
            val distName = uiState.districts.find { it.id == selectedDistrictId }?.name ?: "Choose District"
            OutlinedButton(onClick = { expandedDistrict = true }, modifier = Modifier.fillMaxWidth()) {
                Text(distName)
            }
            DropdownMenu(expanded = expandedDistrict, onDismissRequest = { expandedDistrict = false }) {
                uiState.districts.forEach { district ->
                    DropdownMenuItem(
                        text = { Text(district.name) },
                        onClick = {
                            selectedDistrictId = district.id
                            expandedDistrict = false
                        }
                    )
                }
            }
        }

        Text("How many days?")
        OutlinedTextField(
            value = days,
            onValueChange = { days = it },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = {
                if (selectedDistrictId != null && days.toIntOrNull() != null) {
                    onGenerate(selectedDistrictId!!, days.toInt(), emptyList())
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !uiState.isLoading && selectedDistrictId != null,
            shape = RoundedCornerShape(16.dp)
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            } else {
                Text("Generate Plan securely via AI")
            }
        }
    }
}

@Composable
fun DayPlanScreen(
    itineraryId: Int,
    uiState: ItinerariesUiState,
    onBack: () -> Unit
) {
    val itinerary = uiState.itineraries.find { it.id == itineraryId }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back") }
            Spacer(modifier = Modifier.width(8.dp))
            Text("Your ${itinerary?.days ?: 0}-Day Plan", style = MaterialTheme.typography.titleLarge)
        }

        if (itinerary == null) {
            Text("Itinerary not found.")
            return@Column
        }

        val parsedDays = remember(itinerary.plan) {
            val list = mutableListOf<Triple<String, String, String>>()
            try {
                val parser = Json { ignoreUnknownKeys = true }
                val element = parser.parseToJsonElement(itinerary.plan)
                if (element is kotlinx.serialization.json.JsonArray) {
                    element.jsonArray.forEach { el ->
                        val dayObj = el.jsonObject
                        val dayStr = dayObj["day"]?.jsonPrimitive?.content ?: "Day"
                        val title = dayObj["title"]?.jsonPrimitive?.content ?: "Adventure"
                        val activities = dayObj["activities"]?.jsonArray
                        
                        val itemsString = activities?.joinToString("\n") { 
                            "• " + (it.jsonObject["description"]?.jsonPrimitive?.content ?: "") 
                        } ?: ""
                        list.add(Triple("Day $dayStr", title, itemsString))
                    }
                }
            } catch (e: Exception) {
                list.add(Triple("ERROR", e.message ?: "Unknown Error", ""))
            }
            list
        }

        if (parsedDays.isEmpty()) {
            Text("Could not parse schedule.")
        } else {
            parsedDays.forEach { (day, title, items) ->
                if (day == "ERROR") {
                    Text("Error parsing JSON: $title")
                } else {
                    TripDayCard(
                        day = day,
                        title = title,
                        items = items
                    )
                }
            }
        }
    }
}

@Composable
fun SubmissionScreen(
    uiState: SubmissionUiState,
    onFieldChange: (name: String?, category: String?, description: String?, districtId: Int?, address: String?, cuisines: String?, priceRange: String?, mustTry: String?, stayType: String?, pricePerNight: String?, amenities: String?) -> Unit,
    onMediaPick: (Uri, Boolean) -> Unit,
    onSubmit: () -> Unit,
    onBack: () -> Unit
) {
    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri?.let { onMediaPick(it, false) }
    }
    val videoPicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri?.let { onMediaPick(it, true) }
    }

    Scaffold(
        topBar = {
            androidx.compose.material3.TopAppBar(
                title = { Text("Submit a Place", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState())
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = uiState.name,
                onValueChange = { onFieldChange(it, null, null, null, null, null, null, null, null, null, null) },
                label = { Text("Place Name") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            val categories = listOf("tourist_place", "restaurant", "stay", "hidden_gem")
            Text("Category", style = MaterialTheme.typography.labelLarge)
            Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                categories.forEach { cat ->
                    val isSelected = uiState.category == cat
                    androidx.compose.material3.FilterChip(
                        selected = isSelected,
                        onClick = { onFieldChange(null, cat, null, null, null, null, null, null, null, null, null) },
                        label = { Text(cat.replace("_", " ").titlecase()) }
                    )
                }
            }

            Text("District", style = MaterialTheme.typography.labelLarge)
            Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                uiState.districts.forEach { dist ->
                    val isSelected = uiState.districtId == dist.id
                    androidx.compose.material3.FilterChip(
                        selected = isSelected,
                        onClick = { onFieldChange(null, null, null, dist.id, null, null, null, null, null, null, null) },
                        label = { Text(dist.name) }
                    )
                }
            }

            OutlinedTextField(
                value = uiState.address,
                onValueChange = { onFieldChange(null, null, null, null, it, null, null, null, null, null, null) },
                label = { Text("Address (Optional)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            OutlinedTextField(
                value = uiState.description,
                onValueChange = { onFieldChange(null, null, it, null, null, null, null, null, null, null, null) },
                label = { Text("Description") },
                modifier = Modifier.fillMaxWidth().height(120.dp),
                shape = RoundedCornerShape(12.dp),
                maxLines = 5
            )

            if (uiState.category == "restaurant") {
                Text("Restaurant Details", fontWeight = FontWeight.Bold)
                OutlinedTextField(value = uiState.cuisines, onValueChange = { onFieldChange(null, null, null, null, null, it, null, null, null, null, null) }, label = { Text("Cuisines") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = uiState.mustTry, onValueChange = { onFieldChange(null, null, null, null, null, null, null, it, null, null, null) }, label = { Text("Must Try Dishes") }, modifier = Modifier.fillMaxWidth())
            }

            if (uiState.category == "stay") {
                Text("Stay Details", fontWeight = FontWeight.Bold)
                OutlinedTextField(value = uiState.stayType, onValueChange = { onFieldChange(null, null, null, null, null, null, null, null, it, null, null) }, label = { Text("Stay Type") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = uiState.pricePerNight, onValueChange = { onFieldChange(null, null, null, null, null, null, null, null, null, it, null) }, label = { Text("Price Per Night") }, modifier = Modifier.fillMaxWidth())
            }

            Text("Photos & Videos", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = { imagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }) {
                    Text("Add Photo")
                }
                androidx.compose.material3.OutlinedButton(onClick = { videoPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly)) }) {
                    Text("Add Video")
                }
            }
            
            if (uiState.isUploading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.horizontalScroll(rememberScrollState())) {
                uiState.imageUrls.forEach { url ->
                    Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.size(100.dp)) {
                        coil.compose.AsyncImage(model = url, contentDescription = null, contentScale = androidx.compose.ui.layout.ContentScale.Crop)
                    }
                }
                uiState.videoUrls.forEach { _ ->
                    Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.size(100.dp), colors = CardDefaults.cardColors(containerColor = Color.Black)) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Default.PlayArrow, null, tint = Color.White)
                        }
                    }
                }
            }

            if (uiState.errorMessage != null) {
                Text(uiState.errorMessage, color = MaterialTheme.colorScheme.error)
            }

            Button(
                onClick = onSubmit,
                enabled = !uiState.isLoading && uiState.name.isNotBlank() && uiState.districtId != null,
                modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                if (uiState.isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                else Text("Submit for Approval")
            }
        }
    }

    if (uiState.isSubmitted) {
        androidx.compose.ui.window.Dialog(onDismissRequest = onBack) {
            Card(shape = RoundedCornerShape(24.dp), modifier = Modifier.padding(20.dp)) {
                Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF4CAF50), modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Submission Received!", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
                    Text("Thank you for contributing. Our admins will review it shortly.", textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(onClick = onBack, modifier = Modifier.fillMaxWidth()) { Text("Back to Discover") }
                }
            }
        }
    }
}

@Composable
fun AdminDashboardScreen(
    uiState: AdminUiState,
    onApprove: (Int) -> Unit,
    onReject: (Int, String) -> Unit,
    onApprovePhoto: (Int) -> Unit,
    onRejectPhoto: (Int, String) -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            androidx.compose.material3.TopAppBar(
                title = { Text("Place Approvals") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, null) } },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (uiState.errorMessage != null) {
                Text(
                    text = uiState.errorMessage,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                )
            }

            if (uiState.isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            } else {
                androidx.compose.foundation.lazy.LazyColumn(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    item {
                        Text(
                            text = "Review and verify community-submitted discovery points.",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        if (uiState.pendingPlaces.isEmpty()) {
                            Text("No pending submissions right now.", style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    items(uiState.pendingPlaces) { place ->
                        var rejectReason by remember { mutableStateOf("") }
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(place.name, style = MaterialTheme.typography.titleLarge)
                                Spacer(modifier = Modifier.height(4.dp))
                                val catName = place.category?.replace("_", " ")?.replaceFirstChar { it.uppercase() } ?: "Place"
                                Text("$catName • District ${place.districtId ?: "Unknown"}", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
                                
                                Spacer(modifier = Modifier.height(12.dp))
                                OutlinedTextField(
                                    value = rejectReason,
                                    onValueChange = { rejectReason = it },
                                    placeholder = { Text("Optional rejection reason") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp)
                                )

                                Spacer(modifier = Modifier.height(16.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Button(
                                        onClick = { onApprove(place.id) },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(12.dp)
                                    ) { Text("Approve") }
                                    OutlinedButton(
                                        onClick = { onReject(place.id, rejectReason) },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(12.dp)
                                    ) { Text("Reject") }
                                }
                            }
                        }
                    }

                    item {
                        Text("Pending media additions", style = MaterialTheme.typography.titleLarge)
                        Spacer(modifier = Modifier.height(8.dp))
                        if (uiState.pendingPhotoSubmissions.isEmpty()) {
                            Text("No pending media submissions right now.", style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    items(uiState.pendingPhotoSubmissions) { photo ->
                        var rejectReason by remember { mutableStateOf("") }
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(photo.placeName ?: "Place ${photo.placeId}", style = MaterialTheme.typography.titleLarge)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Submitted by ${photo.submittedByName ?: "Member"}", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
                                
                                Spacer(modifier = Modifier.height(12.dp))
                                val url = photo.mediaUrl ?: photo.imageUrl ?: photo.videoUrl
                                if (photo.mediaType == "video") {
                                    Text("Pending video: $url", style = MaterialTheme.typography.bodyMedium)
                                } else {
                                    Box(modifier = Modifier.fillMaxWidth().height(180.dp).background(Color.LightGray, RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                                        // Normally Coil AsyncImage would go here, fallback to Text for now.
                                        Text("Image Preview", color = Color.DarkGray)
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))
                                OutlinedTextField(
                                    value = rejectReason,
                                    onValueChange = { rejectReason = it },
                                    placeholder = { Text("Optional rejection reason") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp)
                                )

                                Spacer(modifier = Modifier.height(16.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Button(
                                        onClick = { onApprovePhoto(photo.id) },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(12.dp)
                                    ) { Text("Approve Media") }
                                    OutlinedButton(
                                        onClick = { onRejectPhoto(photo.id, rejectReason) },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(12.dp)
                                    ) { Text("Reject Media") }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
