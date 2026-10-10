with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find wp function
idx = content.find('function wp(){return "en"}')
if idx >= 0:
    start = max(0, idx - 500)
    end = min(len(content), idx + 1000)
    print(content[start:end])
else:
    print('Not found with exact match, searching...')
    # Try alternative
    idx = content.find('function wp()')
    if idx >= 0:
        start = max(0, idx - 100)
        end = min(len(content), idx + 500)
        print(content[start:end])