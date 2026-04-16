import sys
import re

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure we add necessary dropdown imports if not already there
imports_to_add = [
    "import androidx.compose.material3.DropdownMenu",
    "import androidx.compose.material3.DropdownMenuItem",
    "import androidx.compose.foundation.lazy.LazyRow",
    "import androidx.compose.foundation.lazy.items",
    "import androidx.compose.material3.FilterChip",
    "import androidx.compose.material3.FilterChipDefaults",
    "import androidx.compose.material3.ExperimentalMaterial3Api",
]

for imp in imports_to_add:
    if imp not in text:
        text = text.replace("import androidx.compose.material3.MaterialTheme\n", f"import androidx.compose.material3.MaterialTheme\n{imp}\n")


target_signature = """@Composable
fun DiscoverScreen(
    uiState: com.incrediblekarnataka.android.app.ui.screens.DiscoverUiState,
    onCategorySelect: (String) -> Unit,
    onPlaceClick: (String) -> Unit
) {"""

replacement_signature = """@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoverScreen(
    uiState: com.incrediblekarnataka.android.app.ui.screens.DiscoverUiState,
    onCategorySelect: (String) -> Unit,
    onDistrictSelect: (Int?) -> Unit,
    onPlaceClick: (String) -> Unit
) {"""

if target_signature in text:
    text = text.replace(target_signature, replacement_signature)

target_search_block = """            OutlinedTextField(
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

        }"""

replacement_search_block = """            OutlinedTextField(
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

            // Category Filter Row
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

            // District Filter Dropdown
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
        }"""

if target_search_block in text:
    text = text.replace(target_search_block, replacement_search_block)

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
