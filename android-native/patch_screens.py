import sys

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update DiscoverScreen else block
target_discover = """            } else {
                filteredPlaces.take(2).forEach { place ->
                    FeaturedDiscoverCard(
                        title = place.name,
                        subtitle = place.category ?: "Destination",
                        accent = Color(0xFF0C7A71),
                        onClick = { onPlaceClick(place.id.toString()) }
                    )
                }

                SectionTitle(title = "All matching places", action = "Open")
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    filteredPlaces.forEach { place ->
                        DiscoverListCard(
                            title = place.name,
                            subtitle = place.category ?: "Destination",
                            onClick = { onPlaceClick(place.id.toString()) }
                        )
                    }
                }
            }"""

replacement_discover = """            } else {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    filteredPlaces.forEach { place ->
                        val formattedCategory = place.category?.split("_", "-")?.joinToString(" ") { 
                            it.replaceFirstChar { char -> if (char.isLowerCase()) char.titlecase() else char.toString() }
                        } ?: "Destination"
                        
                        FeaturedDiscoverCard(
                            title = place.name,
                            subtitle = formattedCategory,
                            accent = Color(0xFF0C7A71),
                            onClick = { onPlaceClick(place.id.toString()) }
                        )
                    }
                }
            }"""

if target_discover in text:
    text = text.replace(target_discover, replacement_discover)
else:
    print("Could not find part 1")
    sys.exit(1)

# 2. Add PlaceDetails updates
target_details = """@Composable
fun PlaceDetailsScreen(
    placeId: String,
    onBack: () -> Unit
) {
    val place = DiscoverPlaces.firstOrNull { it.id == placeId }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        if (place == null) {"""

replacement_details = """@Composable
fun PlaceDetailsScreen(
    uiState: com.incrediblekarnataka.android.app.ui.screens.PlaceDetailsUiState,
    onBack: () -> Unit
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
        } else if (place == null) {"""

if target_details in text:
    text = text.replace(target_details, replacement_details)
else:
    print("Could not find part 2")

target_details_body = """                FeaturedDiscoverCard(
                    title = place.title,
                    subtitle = "${place.category} • ${place.district}",
                    accent = place.accent,
                    onClick = {}
                )
                ActionCard(
                    eyebrow = "About this place",
                    title = "Why it is worth the trip",
                    body = place.details
                )"""

replacement_details_body = """                val formattedCategory = place.category?.split("_", "-")?.joinToString(" ") { 
                    it.replaceFirstChar { char -> if (char.isLowerCase()) char.titlecase() else char.toString() }
                } ?: "Destination"
                
                FeaturedDiscoverCard(
                    title = place.name,
                    subtitle = formattedCategory,
                    accent = Color(0xFF0C7A71),
                    onClick = {}
                )
                if (place.description != null) {
                    ActionCard(
                        eyebrow = "About this place",
                        title = "Why it is worth the trip",
                        body = place.description
                    )
                }"""

if target_details_body in text:
    text = text.replace(target_details_body, replacement_details_body)

# 3. Remove "sort logo under search field"
target_sort_logo = """            Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                IconButton(
                    onClick = {
                        onCategorySelect(if (uiState.selectedCategory == "All") "Heritage" else "All")
                    },
                    modifier = Modifier
                        .clip(RoundedCornerShape(18.dp))
                        .background(MaterialTheme.colorScheme.surface)
                    ) {
                    Icon(Icons.Outlined.FilterList, contentDescription = "Filter")
                }
            }"""
if target_sort_logo in text:
    text = text.replace(target_sort_logo, "")

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
