with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix wp() to return en-US
old = 'function wp(){return "en"}'
new = 'function wp(){return "en-US"}'

if old in content:
    content = content.replace(old, new)
    print('Fixed wp() to en-US')
else:
    print('Pattern not found')
    import re
    for m in re.finditer(r'function wp', content):
        start = max(0, m.start() - 50)
        end = min(len(content), m.end() + 100)
        print(f'Found at {m.start()}: {content[start:end]}')

with open('popup/index.js', 'w', encoding='utf-8') as f:
    f.write(content)