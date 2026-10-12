with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find provider check
for m in re.finditer(r'provider!==["\']api["\']', content):
    start = max(0, m.start() - 100)
    end = min(len(content), m.end() + 100)
    print(f'=== Provider check at {m.start()} ===')
    print(content[start:end])
    print()