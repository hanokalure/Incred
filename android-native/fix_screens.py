import sys

path = r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The file length was 1920.
# We want to keep up to line 1657 (index 1656).
# However, let's be safer and find the start of the first DayPlanScreen.
start_index = -1
for i, line in enumerate(lines):
    if '@Composable' in line and 'fun DayPlanScreen' in line:
        # We find the corrupted one or the first one.
        # Let's look for the one starting around 1658.
        if i >= 1650:
            start_index = i
            break

if start_index == -1:
    print("Could not find DayPlanScreen start")
    sys.exit(1)

# We want to replace everything from start_index to the end with the correct DayPlanScreen.
# The correct logic is the one I have prepared.

new_content = """@Composable
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
                        
                        val itemsString = activities?.joinToString("\\n") { 
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
"""

final_lines = lines[:start_index] + [new_content]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Successfully fixed AppScreens.kt")
