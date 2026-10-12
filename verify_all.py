import re

# Check popup/index.js
with open('popup/index.js', 'r', encoding='utf-8') as f:
    popup_content = f.read()

# Check dismiss target
if 'data-dismiss-target:"#"+G' in open('popup/index.js', 'r', encoding='utf-8').read():
    print('1. Dismiss target fix: PRESENT')
else:
    print('1. Dismiss target fix: MISSING')

# Check wp function
with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()
if 'function wp(){return "en-US"}' in content:
    print('WP default en-US: YES')
else:
    # Check what's there
    m = re.search(r'function wp\(\)', content)
    if m:
        print('WP function found:', content[m.start():m.start()+50])
    else:
        print('WP function not found')

# Check provider check in background
with open('background/index.js', 'r', encoding='utf-8') as f:
    bg_content = f.read()
if 'only working with OpenAI provider' not in bg_content:
    print('Provider check removed: YES')
else:
    print('Provider check: STILL PRESENT')

# Check context menu fix in background
with open('background/index.js', 'r', encoding='utf-8') as f:
    bg_content = f.read()
if 'try{Z.default.contextMenus.remove' in bg_content:
    print('Context menu fix: PRESENT')
else:
    print('Context menu fix: MISSING')

print('\nAll checks complete.')