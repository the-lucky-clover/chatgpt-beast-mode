with open('content-script/index.js', 'r') as f:
    content = f.read()

old = '});async function Ne() {'
new = '});window.addEventListener("error",e=>{if(e?.filename?.includes("cdn.fonts.net")||e?.message?.includes("Failed to decode downloaded font")){e.preventDefault();e.stopImmediatePropagation();return false}},true);async function Ne() {'

if old in content:
    content = content.replace(old, new)
    with open('content-script/index.js', 'w') as f:
        f.write(content)
    print('Success!')
else:
    print('Pattern not found')