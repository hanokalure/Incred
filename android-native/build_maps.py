import sys
import re

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'r', encoding='utf-8') as f:
    text = f.read()

imports_to_add = [
    "import com.google.android.gms.maps.model.CameraPosition",
    "import com.google.android.gms.maps.model.LatLng",
    "import com.google.maps.android.compose.GoogleMap",
    "import com.google.maps.android.compose.Marker",
    "import com.google.maps.android.compose.MarkerState",
    "import com.google.maps.android.compose.rememberCameraPositionState",
    "import androidx.compose.material3.ModalBottomSheet",
    "import androidx.compose.material3.rememberModalBottomSheetState",
    "import android.content.Intent",
    "import android.net.Uri",
    "import com.incrediblekarnataka.android.data.model.PlaceCardDto"
]

for imp in imports_to_add:
    if imp not in text:
        text = text.replace("import androidx.compose.material3.MaterialTheme\n", f"import androidx.compose.material3.MaterialTheme\n{imp}\n")


target_mapscreen = """@Composable
fun MapScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        HeroPanel(
            title = "Travel map",
            subtitle = "Use this UI shell for nearby places, route overlays, and district-based exploration."
        )
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color(0xFFCBEDE5), Color(0xFF85B9A9), Color(0xFF4E7A42))
                        )
                    )
                    .padding(20.dp)
            ) {
                Text(
                    text = "Map Preview",
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White
                )
                Column(
                    modifier = Modifier.align(Alignment.BottomStart),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MapPinTag("Mysuru Palace")
                    MapPinTag("Coorg Escapes")
                    MapPinTag("Jog Falls")
                }
            }
        }
        SectionTitle(title = "Nearby now", action = "Sort")
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            DiscoverListCard("Heritage core", "Mysuru - 2.1 km away", onClick = {})
            DiscoverListCard("Breakfast street", "Bengaluru - 1.4 km away", onClick = {})
            DiscoverListCard("Sunrise ruins", "Hampi - saved for weekend", onClick = {})
        }
    }
}"""

replacement_mapscreen = """@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(
    uiState: MapUiState,
    onCategorySelect: (String) -> Unit,
    onPlaceClick: (String) -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var selectedPlace by remember { mutableStateOf<PlaceCardDto?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)

    // Default to a central Karnataka location
    val defaultLocation = LatLng(14.8, 75.8)
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(defaultLocation, 6f)
    }

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

            // Google Map Fill
            GoogleMap(
                modifier = Modifier.fillMaxSize(),
                cameraPositionState = cameraPositionState
            ) {
                uiState.places.forEach { place ->
                    if (place.latitude != null && place.longitude != null) {
                        Marker(
                            state = MarkerState(position = LatLng(place.latitude, place.longitude)),
                            title = place.name,
                            snippet = place.category,
                            onClick = {
                                selectedPlace = place
                                false // Return false to allow default info window behavior
                            }
                        )
                    }
                }
            }
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
}"""

if target_mapscreen in text:
    text = text.replace(target_mapscreen, replacement_mapscreen)
else:
    print("Could not find MapScreen to replace!")

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
