import sys

with open(r'c:\Karnataka\android-native\app\build.gradle.kts', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.rfind("}")
if idx != -1:
    new_text = text[:idx+1] + "\n"
    with open(r'c:\Karnataka\android-native\app\build.gradle.kts', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("done")
else:
    print("error")
