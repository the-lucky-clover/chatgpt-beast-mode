with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the provider check in the cX component
old = 'd?.provider!=="api"?e(!0):e(!1)'
new = 'e(!1)'

if old in content:
    content = content.replace(old, new)
    with open('popup/index.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed provider check in popup bundle')
else:
    print('Pattern not found, trying alternative...')
    old2 = "d?.provider!=='api'?e(!0):e(!1)"
    if old2 in content:
        content = content.replace(old2, new)
        with open('popup/index.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed with alt pattern')
    else:
        print('Neither pattern found')