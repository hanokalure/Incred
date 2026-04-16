import sys

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find("fun DiscoverScreen(")
start_idx = text.rfind("@Composable", 0, start_idx)

end_idx = text.find("fun PlaceDetailsScreen(")
end_idx = text.rfind("@Composable", 0, end_idx)

if start_idx == -1 or end_idx == -1:
    print("Cannot find markers", start_idx, end_idx)
    sys.exit(1)

new_code = """@Composable
fun DiscoverScreen(
    uiState: com.incrediblekarnataka.android.app.ui.screens.DiscoverUiState,
    onCategorySelect: (String) -> Unit,
    onPlaceClick: (String) -> Unit
) {
    androidx.compose.runtime.getValue
    androidx.compose.runtime.setValue
    androidx.compose.runtime.rememberSaveable
    var query by androidx.compose.runtime.saveable.rememberSaveable { androidx.compose.runtime.mutableStateOf("") }
    val categories = listOf("All", "Temples", "Waterfalls", "Hill stations", "Food", "Heritage", "Adventure")
    
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
            Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
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
            }
        }

        HeroPanel(
            title = "Discover Karnataka",
            subtitle = "Browse hill towns, heritage circuits, local food streets, and weekend-ready picks in one place."
        )

        SectionTitle(title = "Browse by vibe", action = "More")
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            categories.forEach { category ->
                DiscoverChip(
                    label = category,
                    selected = category == uiState.selectedCategory,
                    onClick = { onCategorySelect(category) }
                )
            }
        }

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
            }
        }
    }
}

"""

text = text[:start_idx] + new_code + text[end_idx:]
with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
