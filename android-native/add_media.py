import sys
import re

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add ExoPlayer VideoPlayer at top of file
video_player_code = """
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.compose.ui.viewinterop.AndroidView

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
"""
if "fun VideoPlayer" not in text:
    # Insert it right before @Composable fun PlaceDetailsScreen
    pattern = re.compile(r'(@Composable\s*fun PlaceDetailsScreen)', re.DOTALL)
    text = pattern.sub(video_player_code + r'\1', text, count=1)


# 2. Replace PlaceDetailsScreen image logic with scroll views for multiple images and multiple videos
target_image_block = """                val imagePath = place.imageUrls?.firstOrNull()
                if (imagePath != null) {
                    val url = if (imagePath.startsWith("http")) imagePath else "http://10.0.2.2:8000/files/place-images/$imagePath"
                    coil.compose.AsyncImage(
                        model = url,
                        contentDescription = "Place photo",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(280.dp)
                            .clip(RoundedCornerShape(16.dp)),
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop
                    )
                }"""

replacement_media_block = """                if (!place.imageUrls.isNullOrEmpty()) {
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
                }"""

if target_image_block in text:
    text = text.replace(target_image_block, replacement_media_block)
else:
    print("Could not find image block!")

# 3. Handle the profile role/name display
target_profile_email = """                    Text(
                        text = user?.email ?: "",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFFFFF7E8)
                    )"""
replacement_profile_email = """                    Text(
                        text = "Role: ${user?.role ?: "User"}  •  ${user?.email ?: ""}",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFFFFF7E8)
                    )"""

if target_profile_email in text:
    text = text.replace(target_profile_email, replacement_profile_email)


with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
