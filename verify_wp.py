with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Verify the change
if 'function wp(){return "en-US"}' in content:
    print('wp() correctly returns en-US')
else:
    print('wp() not found or not changed')

# Also check for any other language defaults
import re
for m in re.finditer(r'return\s+["\']en', content):
    start = max(0, m.start() - 100)
    end = min(len(content), m.end() + 100)
    print(f'=== Return en at {m.start()} ===')
    print(content[start:end])
    print()