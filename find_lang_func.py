with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Search for function that returns language code
idx = content.find('async function zi(l,I)')
if idx >= 0:
    search_area = content[max(0, idx-10000):idx]
    
    # Look for functions that might return language
    pattern = r'function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*return\s+[^}]*(?:\"en\"|\"ar\"|\"en-US\"|navigator\.language)'
    for m in re.finditer(pattern, search_area):
        start = max(0, m.start() - 50)
        end = min(len(search_area), m.end() + 300)
        print(f'=== Function at relative {m.start()} ===')
        print(search_area[start:end])
        print()