import sys

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'r', encoding='utf-8') as f:
    text = f.read()

# Strip Google Maps Imports
text = text.replace("import com.google.android.gms.maps.model.CameraPosition\n", "")
text = text.replace("import com.google.android.gms.maps.model.LatLng\n", "")
text = text.replace("import com.google.maps.android.compose.GoogleMap\n", "")
text = text.replace("import com.google.maps.android.compose.Marker\n", "")
text = text.replace("import com.google.maps.android.compose.MarkerState\n", "")
text = text.replace("import com.google.maps.android.compose.rememberCameraPositionState\n", "")

# Add osmdroid imports
osmdroid_imports = """import org.osmdroid.config.Configuration
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import android.preference.PreferenceManager
import androidx.compose.ui.viewinterop.AndroidView
import com.incrediblekarnataka.android.BuildConfig
"""

text = text.replace("import androidx.media3.common.MediaItem\n", f"{osmdroid_imports}\nimport androidx.media3.common.MediaItem\n")

target_mapscreen = """            // Google Map Fill
            GoogleMap(
                modifier = Modifier.fillMaxWidth().weight(1f),
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
            }"""


replacement_mapscreen = """            // OSMDroid Map Fill
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
            )"""

if target_mapscreen in text:
    text = text.replace(target_mapscreen, replacement_mapscreen)
else:
    print("WARNING: Could not find target GoogleMap snippet.")

# Also replace the unused CameraPosition state variables inside MapScreen
cam_state_target = """    // Default to a central Karnataka location
    val defaultLocation = LatLng(14.8, 75.8)
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(defaultLocation, 6f)
    }"""

if cam_state_target in text:
    text = text.replace(cam_state_target, "")
else:
    print("WARNING: Could not find cam_state_target.")

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
