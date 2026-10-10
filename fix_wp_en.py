with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Change wp() to return 'en-US' instead of 'en'
old = 'function wp(){return "en"}'
new = 'function wp(){return "en-US"}'

if old in content:
    content = content.replace(old, new)
    with open('popup/index.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Successfully changed wp() to return en-US')
else:
    print('Pattern not found')