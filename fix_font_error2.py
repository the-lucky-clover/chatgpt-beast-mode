with open('content-script/index.js', 'r') as f:
    content = f.read()

old = '});\nasync function Ne() {'
new = '});\nwindow.addEventListener("error",e=>{if(e?.filename?.includes("cdn.fonts.net")||e?.message?.includes("Failed to decode downloaded font")){e.preventDefault();e.stopImmediatePropagation();return false}},true);\nasync function Ne() {'

if old in content:
    content = content.replace(old, new)
    with open('content-script/index.js', 'w') as f:
        f.write(content)
    print('Success!')
else:
    print('Pattern not found, trying without newline...')
    old2 = '});async function Ne() {'
    if old2 in content:
        content = content.replace(old2, new)
        with open('content-script/index.js', 'w') as f:
            f.write(content)
        print('Success with alt pattern!')
    else:
        print('Neither pattern found')