with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Check if the error message is in the popup bundle
if 'only working with OpenAI provider' in content:
    print('ERROR: Error message STILL in popup/index.js bundle')
else:
    print('OK: Error message removed from popup/index.js')

# Also check for the provider check
if 'provider!=="api"' in content or "provider!=='api'" in content:
    print('WARNING: Provider check may still exist in popup bundle')
else:
    print('OK: No provider check in popup bundle')