with open('popup/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Verify the fix
if 'data-dismiss-target:"#"+G' in content:
    print('OK: dismiss target fixed')
else:
    print('ERROR: dismiss target not fixed')

# Check for any remaining #alert-border-3
if 'alert-border-3' in content:
    print('WARNING: alert-border-3 still present')
else:
    print('OK: alert-border-3 removed')