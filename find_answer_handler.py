with open('background/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find answer handling
for m in re.finditer(r'case "answer"', content):
    start = max(0, m.start() - 100)
    end = min(len(content), m.end() + 1000)
    print(f'=== Answer handler at {m.start()} ===')
    print(content[start:end])
    print()