with open('content-script/index.js', 'r') as f:
    content = f.read()

# Fix the it function - initialize r at right edge (maxX - 10) instead of 10
old_it = 'function it(e,t){e.style.position="fixed",e.style.transformOrigin="top left";const buffer=12;let r=10,s=10,vx=0,vy=0;const rect=e.getBoundingClientRect();const maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;r=Math.min(10,maxX-10);s=Math.min(10,maxY-10);e.style.transform=`translate(${r}px, ${s}px)`;'

new_it = 'function it(e,t){e.style.position="fixed",e.style.transformOrigin="top left";const buffer=12;let r=0,s=10,vx=0,vy=0;const rect=e.getBoundingClientRect();const maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;r=maxX-10;s=Math.min(10,maxY-10);e.style.transform=`translate(${r}px, ${s}px)`;'

if old_it in content:
    content = content.replace(old_it, new_it)
    print('Fixed it() initialization')
else:
    print('Pattern not found for it()')

# Fix _resetDrag to also use right-edge positioning
old_reset = 'e._resetDrag=()=>{r=10,s=10,vx=0,vy=0;const rect=e.getBoundingClientRect();const maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;r=Math.min(10,maxX-10);s=Math.min(10,maxY-10);e.style.transform=`translate(${r}px, ${s}px)`}'

new_reset = 'e._resetDrag=()=>{r=0,s=10,vx=0,vy=0;const rect=e.getBoundingClientRect();const maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;r=maxX-10;s=Math.min(10,maxY-10);e.style.transform=`translate(${r}px, ${s}px)`}'

if old_reset in content:
    content = content.replace(old_reset, new_reset)
    print('Fixed _resetDrag()')
else:
    print('Pattern not found for _resetDrag()')

with open('content-script/index.js', 'w') as f:
    f.write(content)
print('Done')