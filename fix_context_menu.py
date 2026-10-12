with open('background/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the context menu creation - remove first then create
old = 'Z.default.contextMenus.create({id:"summarizeSelectionItem",title:Z.default.i18n.getMessage("summarizeText"),contexts:["selection"]}),zD()'
new = 'try{Z.default.contextMenus.remove("summarizeSelectionItem")}catch{}Z.default.contextMenus.create({id:"summarizeSelectionItem",title:Z.default.i18n.getMessage("summarizeText"),contexts:["selection"]}),zD()'

if old in content:
    content = content.replace(old, new)
    with open('background/index.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed context menu creation')
else:
    print('Pattern not found')