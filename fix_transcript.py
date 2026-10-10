with open('content-script/index.js', 'r') as f:
    content = f.read()

# Fix 1: Make zt() more permissive
old_zt = '''async function zt(url, videoId) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".youtube.com") || parsed.pathname !== "/api/timedtext" || parsed.searchParams.get("v") !== videoId) return;
    const text = await bmCaptionFetch(url);
    if (!text?.trim()) return;
    let valid = false;
    try { valid = JSON.parse(text).events?.some(event => event.segs?.some(segment => segment.utf8?.trim())); }
    catch {
      const xml = new DOMParser().parseFromString(text, "text/xml");
      valid = !xml.querySelector("parsererror") && [...xml.querySelectorAll("transcript > text")].some(node => node.textContent.trim());
    }
    if (valid) return {text, videoId};
  } catch {}'''

new_zt = '''async function zt(url, videoId) {
  try {
    const parsed = new URL(url);
    const isYoutubeDomain = parsed.hostname.endsWith(".youtube.com") || 
                            parsed.hostname.endsWith(".ytimg.com") || 
                            parsed.hostname.endsWith(".googlevideo.com") ||
                            parsed.hostname.includes("youtube");
    const isCaptionPath = parsed.pathname === "/api/timedtext" || 
                          parsed.pathname.startsWith("/api/timedtext") ||
                          parsed.pathname.includes("timedtext");
    if (!isYoutubeDomain || !isCaptionPath || parsed.searchParams.get("v") !== videoId) return;
    const text = await bmCaptionFetch(url);
    if (!text?.trim()) return;
    let valid = false;
    try { valid = JSON.parse(text).events?.some(event => event.segs?.some(segment => segment.utf8?.trim())); }
    catch {
      const xml = new DOMParser().parseFromString(text, "text/xml");
      valid = !xml.querySelector("parsererror") && [...xml.querySelectorAll("transcript > text")].some(node => node.textContent.trim());
    }
    if (valid) return {text, videoId};
  } catch {}'''

if old_zt in content:
    content = content.replace(old_zt, new_zt)
    print('zt() fixed')
else:
    print('zt() pattern not found')

# Fix 2: Change credentials to 'omit' for cross-origin caption fetches
old_fetch = 'const response = await fetch(url, {credentials: "same-origin", signal: controller.signal});'
new_fetch = 'const response = await fetch(url, {credentials: "omit", signal: controller.signal});'

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)
    print('fetch credentials fixed')
else:
    print('fetch pattern not found')

with open('content-script/index.js', 'w') as f:
    f.write(content)
print('Done')