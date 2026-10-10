with open('background/index.js', 'r') as f:
    content = f.read()

old = 'let t=await cy();if(t.provider!=="api")throw new Error("Unfortunately this functionality is only working with OpenAI provider");'
new = 'let t=await cy();'

if old in content:
    content = content.replace(old, new)
    with open('background/index.js', 'w') as f:
        f.write(content)
    print('Success!')
else:
    print('Pattern not found exactly, searching...')
    import re
    matches = list(re.finditer(r't\.provider!=="api"', content))
    for m in matches:
        start = max(0, m.start() - 100)
        end = min(len(content), m.end() + 100)
        print(f'Found at {m.start()}: {content[start:end]}')