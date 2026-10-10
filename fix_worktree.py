with open('.kilo/worktrees/sphenoid-nest/background/index.js', 'r') as f:
    content = f.read()

old = 'let t=await cy();if(t.provider!=="api")throw new Error("Unfortunately this functionality is only working with OpenAI provider");'
new = 'let t=await cy();'

if old in content:
    content = content.replace(old, new)
    with open('.kilo/worktrees/sphenoid-nest/background/index.js', 'w') as f:
        f.write(content)
    print('Fixed worktree!')
else:
    print('Pattern not found in worktree')