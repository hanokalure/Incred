import sys

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'r', encoding='utf-8') as f:
    text = f.read()

target_title_block = """                Text(
                    text = place.name,
                    style = MaterialTheme.typography.displaySmall,
                    color = MaterialTheme.colorScheme.onBackground
                )"""

replacement_title_block = """                Text(
                    text = place.name,
                    style = MaterialTheme.typography.displaySmall,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = "${place.avgRating ?: "—"} ★  •  ${place.address ?: "Location unavailable"}",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )"""

if target_title_block in text:
    text = text.replace(target_title_block, replacement_title_block)
else:
    print("Could not find title block")

target_description_block = """                if (place.description != null) {
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
                }"""

replacement_description_block = """                if (place.description != null) {
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
                    }.joinToString("\\n")
                    
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
                    }.joinToString("\\n")
                    
                    if (lines.isNotBlank()) {
                        ActionCard(
                            eyebrow = "Stay particulars",
                            title = "Checking in",
                            body = lines
                        )
                    }
                }"""

if target_description_block in text:
    text = text.replace(target_description_block, replacement_description_block)
else:
    print("Could not find description block")

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
