with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Search for return with language codes
pattern = r'return\s+["\']en'
for m in re.finditer(pattern, content):
    start = max(0, m.start() - 200)
    end = min(len(content), m.end() + 200)
    print(f'=== Return en at {m.start()} ===')
    print(content[start:end])
    print()