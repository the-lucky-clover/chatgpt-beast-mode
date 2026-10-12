import re

with open('content-script/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the it function
old = 'function it(e,t){e.style.position="fixed",e.style.transformOrigin="top left";const buffer=12;let r=0,s=10,vx=0,vy=0;const rect=e.getBoundingClientRect();const maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;r=maxX-10;s=Math.min(10,maxY-10);e.style.transform=`translate(${r}px, ${s}px)`;const friction=0.88,bounce=0.6;function clampAndBounce(){const rect=e.getBoundingClientRect(),maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;let bounced=!1;if(r<buffer){r=buffer;vx=-vx*bounce}bounced||=r<buffer;if(r>maxX-buffer){r=maxX-buffer;vx=-vx*bounce}bounced||=r>maxX-buffer;if(s<buffer){s=buffer;vy=-vy*bounce}bounced||=s<buffer;if(s>maxY-buffer){s=maxY-buffer;vy=-vy*bounce}bounced||=s>maxY-buffer;if(!bounced){r=Math.max(buffer,Math.min(r,maxX-buffer));s=Math.max(buffer,Math.min(s,maxY-buffer))}e.style.transform=`translate(${r}px, ${s}px)`}function animate(){vx*=friction;vy*=friction;if(Math.abs(vx)>0.1||Math.abs(vy)>0.1){r+=vx;s+=vy;clampAndBounce();requestAnimationFrame(animate)}}window.addEventListener("message",a=>{if(a?.data?.runtimeId!==t)return;let i=a.data;switch(i.type){case"DRAG_MOUSEMOVE":{vx=i.movementX;vy=i.movementY;r+=vx;s+=vy;clampAndBounce();break}}},!1);e._resetDrag=()=>{r=0,s=10,vx=0,vy=0;const rect=e.getBoundingClientRect();const maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;r=maxX-10;s=Math.min(10,maxY-10);e.style.transform=`translate(${r}px, ${s}px)`}}'

new = '''function it(e,t){e.style.position="fixed",e.style.transformOrigin="top left";const buffer=12;let r=0,s=10,vx=0,vy=0;const rect=e.getBoundingClientRect();const maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;r=Math.max(buffer,Math.min(10,maxX-buffer));s=Math.max(buffer,Math.min(10,maxY-buffer));e.style.transform=`translate(${r}px, ${s}px)`;const friction=0.88,bounce=0.6;function clampAndBounce(){const rect=e.getBoundingClientRect(),maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;let bounced=!1;if(r<buffer){r=buffer;vx=-vx*bounce}bounced||=r<buffer;if(r>maxX-buffer){r=maxX-buffer;vx=-vx*bounce}bounced||=r>maxX-buffer;if(s<buffer){s=buffer;vy=-vy*bounce}bounced||=s<buffer;if(s>maxY-buffer){s=maxY-buffer;vy=-vy*bounce}bounced||=s>maxY-buffer;if(!bounced){r=Math.max(buffer,Math.min(r,maxX-buffer));s=Math.max(buffer,Math.min(s,maxY-buffer))}e.style.transform=`translate(${r}px, ${s}px)`}function animate(){vx*=friction;vy*=friction;if(Math.abs(vx)>0.1||Math.abs(vy)>0.1){r+=vx;s+=vy;clampAndBounce();requestAnimationFrame(animate)}}window.addEventListener("message",a=>{if(a?.data?.runtimeId!==t)return;let i=a.data;switch(i.type){case"DRAG_MOUSEMOVE":{vx=i.movementX;vy=i.movementY;r+=vx;s+=vy;clampAndBounce();break}}},!1);e._resetDrag=()=>{const rect=e.getBoundingClientRect();const maxX=window.innerWidth-rect.width,maxY=window.innerHeight-rect.height;r=Math.max(buffer,Math.min(10,maxX-buffer));s=Math.max(buffer,Math.min(10,maxY-buffer));e.style.transform=`translate(${r}px, ${s}px)`;vx=0;vy=0}}'''

with open('content-script/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

if old in content:
    content = content.replace(old, new)
    with open('content-script/index.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed drag handler')
else:
    print('Pattern not found')
    # Try to find the function
    idx = content.find('function it(e,t)')
    if idx >= 0:
        print(f'Found at index {idx}')
        print(content[idx:idx+200])
    else:
        print('Function not found')