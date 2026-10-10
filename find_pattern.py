import re

with open('popup/index.js', 'r') as f:
    content = f.read()

# Find the alertAskQuestion message being used
matches = [(m.start(), m.end()) for m in re.finditer('alertAskQuestion', content)]
for m in matches[:3]:
    start = max(0, m[0] - 200)
    end = min(len(content), m[1] + 300)
    print(f"--- Position {m[0]} ---")
    print(content[start:end])
    print()