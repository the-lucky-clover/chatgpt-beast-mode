with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the dismiss target to use the notification's actual ID instead of hardcoded #alert-border-3
old = '"data-dismiss-target":"#alert-border-3"'
new = '"data-dismiss-target":"#"+G'

if old in content:
    content = content.replace(old, new)
    with open('popup/index.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed dismiss target to use notification ID')
else:
    print('Pattern not found')