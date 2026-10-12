with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Check all data-dismiss-target occurrences
import re
for m in re.finditer(r'data-dismiss-target', content):
    start = max(0, m.start() - 30)
    end = min(len(content), m.end() + 50)
    print(f'At {m.start()}: {content[start:end]}')