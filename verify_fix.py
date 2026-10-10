import re

with open('popup/index.js', 'r') as f:
    content = f.read()

# Verify the fix is applied
if 'I?.provider!=="api"' in content:
    print('WARNING: Provider check still present!')
else:
    print('SUCCESS: Provider check removed')

# Check the replacement
idx = content.find('pb.remove("ask-question-alert"),c(!1)')
if idx >= 0:
    print(f'Found replacement at {idx}')
    print(content[idx-50:idx+100])