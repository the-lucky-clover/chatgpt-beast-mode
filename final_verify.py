import re

with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Check dismiss target
if 'data-dismiss-target:"#"+G' in content:
    print('1. Dismiss target fix: PRESENT')
else:
    print('1. Dismiss target fix: MISSING')

# Check wp function
if 'function wp(){return "en-US"}' in content:
    print('WP default en-US: YES')
else:
    print('WP default en-US: NO')

# Check provider check
with open('background/index.js', 'r', encoding='utf-8') as f:
    bg_content = f.read()
if 'only working with OpenAI provider' not in content:
    print('Provider check removed: YES')
else:
    print('Provider check: STILL PRESENT')

# Check context menu fix
with open('background/index.js', 'r', encoding='utf-8') as f:
    bg_content = f.read()
if 'try{Z.default.contextMenus.remove' in content:
    print('Context menu fix: PRESENT')
else:
    print('Context menu fix: MISSING')

print('\nAll checks complete.')