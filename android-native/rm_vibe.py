import sys

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'r', encoding='utf-8') as f:
    text = f.read()

target = """        SectionTitle(title = "Browse by vibe", action = "More")
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
        }"""

# Since line endings might mismatch, let's just do a smarter replace
import re

pattern = re.compile(r'\s*SectionTitle\(title = "Browse by vibe".*?\}\n\s*\}', re.DOTALL)
new_text = pattern.sub('', text)

if new_text == text:
    print("No changes made!")
    sys.exit(1)

with open(r'c:\Karnataka\android-native\app\src\main\java\com\incrediblekarnataka\android\app\ui\screens\AppScreens.kt', 'w', encoding='utf-8') as f:
    f.write(new_text)
print("done")
