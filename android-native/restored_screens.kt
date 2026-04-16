
@Composable
fun PlaceDetailsScreen(
    placeId: String,
    onBack: () -> Unit
) {
    val place = DiscoverPlaces.firstOrNull { it.id == placeId }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        if (place == null) {
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
                FeaturedDiscoverCard(
                    title = place.title,
                    subtitle = "${place.category} • ${place.district}",
                    accent = place.accent,
                    onClick = {}
                )
                ActionCard(
                    eyebrow = "About this place",
                    title = "Why it is worth the trip",
                    body = place.details
                )
                ActionCard(
                    eyebrow = "Best for",
                    title = "Weekend planning",
                    body = "Use this stop for flexible travel plans, short local experiences, and cleaner route building in the next itinerary step."
                )
            }
        }
    }
}

@Composable
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
}

@Composable
fun TripsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        HeroPanel(
            title = "Plan your trip",
            subtitle = "A clean itinerary builder with fake data now, ready for backend sync later."
        )
        ActionCard(
            eyebrow = "Upcoming",
            title = "Coorg weekend",
            body = "Day 1: drive, coffee estate, sunset point. Day 2: local breakfast, short trail, return."
        )
        SectionTitle(title = "Day-wise plan", action = "Edit")
        TripDayCard(
            day = "Day 1",
            title = "Bengaluru to Coorg",
            items = "Start at 6:30 AM, breakfast stop, estate check-in, Raja's Seat sunset"
        )
        TripDayCard(
            day = "Day 2",
            title = "Coffee trail and return",
            items = "Plantation walk, local lunch, souvenir stop, evening drive back"
        )
        ActionCard(
            eyebrow = "Packing cues",
            title = "What to carry",
            body = "Light layers, rain cover, charger, walking shoes, and one offline map download."
        )
    }
}

@Composable
fun SavedScreen() {
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
        SectionTitle(title = "Weekend shortlist", action = "Manage")
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SavedPlaceCard("Hampi Ruins", "Heritage - sunrise route and temples")
            SavedPlaceCard("Udupi Food Streets", "Food - breakfast and market walk")
            SavedPlaceCard("Jog Falls", "Waterfalls - monsoon priority")
        }
        SectionTitle(title = "Collections", action = "New")
        ActionRow()
    }
}

@Composable
fun ProfileScreen(
    user: com.incrediblekarnataka.android.data.model.UserDto? = null
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
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Traveler profile",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color(0xFF1D4A40)
                    )
                    Text(
                        text = user?.name ?: "Asha Rao",
                        style = MaterialTheme.typography.displaySmall,
                        color = Color.White
                    )
                    Text(
                        text = user?.email ?: "Weekend explorer - heritage lover - food trail collector",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFFFFF7E8)
                    )
                }
            }
        }
        SectionTitle(title = "Travel stats", action = "This year")
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            QuickActionCard("12", "Saved places")
            QuickActionCard("4", "Trips planned")
            QuickActionCard("7", "Cities explored")
        }
        SectionTitle(title = "Preferences", action = "Update")
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            DiscoverListCard("Travel style", "Slow weekends and culture-first routes", onClick = {})
            DiscoverListCard("Food preference", "Vegetarian-friendly local picks", onClick = {})
            DiscoverListCard("Stay type", "Boutique stays and scenic homestays", onClick = {})
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
