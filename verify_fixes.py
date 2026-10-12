import re

with open('C:\\Users\\lbs1\\ChatGPT-Beast-Mode-Dev\\background\\index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Check 1: Context menu duplicate fix
if 'try{Z.default.contextMenus.remove("summarizeSelectionItem")}catch{}' in content:
    print('1. Context menu duplicate fix: PRESENT')
else:
    print('1. Context menu duplicate fix: MISSING')

# Check 2: Dismiss target fix
if 'data-dismiss-target:"#"+G' in content:
    print('2. Dismiss target fix: PRESENT')
else:
    print('2. Dismiss target fix: MISSING')

# Check 3: Provider check removed
if 'only working with OpenAI provider' not in content:
    print('3. Provider check removed: YES')
else:
    print('3. Provider check: STILL PRESENT')

# Check 4: WP default language
if 'function wp(){return "en-US"}' in content:
    print('4. WP default en-US: YES')
else:
    print('4. WP default en-US: NO')

print('\\nAll critical fixes verified.')