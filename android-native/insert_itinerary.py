import sys
import re

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure we have the right imports
extra_imports = """import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
"""

if "import kotlinx.serialization.json.Json" not in text:
    text = text.replace("import androidx.compose.material3.MaterialTheme\n", f"import androidx.compose.material3.MaterialTheme\n{extra_imports}\n")


new_screens = """
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

        try {
            // The AI returns a JSON structure list of days
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

                    TripDayCard(
                        day = "Day $dayStr",
                        title = title,
                        items = itemsString
                    )
                }
            } else {
                Text("Could not parse schedule.")
            }
        } catch (e: Exception) {
            Text("Error parsing JSON: ${e.message}")
        }
    }
}
"""

text += new_screens

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
