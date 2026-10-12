with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix dismiss target
old = 'data-dismiss-target:"#alert-border-3"'
new = 'data-dismiss-target:"#"+G'

if old in content:
    content = content.replace(old, new)
    print('Fixed dismiss target')
else:
    print('Pattern not found, searching...')
    import re
    for m in re.finditer(r'data-dismiss-target', content):
        start = max(0, m.start() - 30)
        end = min(len(content), m.end() + 50)
        print(f'Found at {m.start()}: {content[start:end]}')

with open('popup/index.js', 'w', encoding='utf-8') as f:
    f.write(content)