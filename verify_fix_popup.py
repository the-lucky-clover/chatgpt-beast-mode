with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Verify fix
if 'only working with OpenAI provider' in content:
    print('ERROR: Error message still exists')
else:
    print('OK: Error message removed')

# Check for provider checks
has_provider_check = False
if 'provider!=="api"' in content:
    print('WARNING: provider!=="api" still exists')
    has_provider_check = True
if "provider!=='api'" in content:
    print("WARNING: provider!=='api' still exists")
    has_provider_check = True

if not has_provider_check:
    print('OK: No provider checks found')