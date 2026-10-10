import re

with open('popup/index.js', 'r') as f:
    content = f.read()

# Find and replace the provider check
old_code = 'I?.provider!=="api"?(Rb.sendNotification({element:(0,WZ.jsxs)("span",{children:[(0,WZ.jsx)("b",{children:"Alert:"})," ",GX.default.i18n.getMessage("alertAskQuestion")]}),position:"top-center",id:"ask-question-alert",toastType:"blank"}),c(!0)):(pb.remove("ask-question-alert"),c(!1))'

new_code = '(pb.remove("ask-question-alert"),c(!1))'

if old_code in content:
    content = content.replace(old_code, new_code)
    with open('popup/index.js', 'w') as f:
        f.write(content)
    print("Successfully removed provider check!")
else:
    print("Pattern not found exactly, trying fuzzy match...")
    # Try with escaped regex
    pattern = re.escape('I?.provider!=="api"?') + '.*?' + re.escape('pb.remove("ask-question-alert"),c(!1))')
    matches = list(re.finditer(pattern, content, re.DOTALL))
    if matches:
        print(f"Found {len(matches)} fuzzy matches")
        for m in matches:
            print(f"  Position {m.start()}: {content[m.start():m.end()][:200]}...")
    else:
        print("No fuzzy matches either")

# Also remove the availableAskQuestion message display if present
# Search for where availableAskQuestion is used
matches2 = [(m.start(), m.end()) for m in re.finditer('availableAskQuestion', content)]
for m in matches2[:3]:
    start = max(0, m[0] - 100)
    end = min(len(content), m[1] + 200)
    print(f"\n--- availableAskQuestion at {m[0]} ---")
    print(content[start:end])