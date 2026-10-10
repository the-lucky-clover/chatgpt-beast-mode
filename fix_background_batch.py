with open('background/index.js', 'r') as f:
    content = f.read()

# Find the switch statement in the background message listener
old_switch = '''switch(r.type){case"OPEN_OPTIONS_PAGE":{Z.default.runtime.openOptionsPage();break}case"GET_ACCESS_TOKEN":try{return await xo()}catch{return}case"GET_CHAT_REQUIREMENTS":return await ol();case"RETRY":{let t=bmSummaryKey(await vo(),r);Ug(t),await wO(t);break}case"SEEK_TO_TIME":{Z.default.tabs.update(r.tabId,{url:r.link});break}case"REPORT_ERROR":{zg.reportError(r.errorEvent);break}case"GET_MODELS":return await ul()}'''

new_switch = '''switch(r.type){case"OPEN_OPTIONS_PAGE":{Z.default.runtime.openOptionsPage();break}case"GET_ACCESS_TOKEN":try{return await xo()}catch{return}case"GET_CHAT_REQUIREMENTS":return await ol();case"RETRY":{let t=bmSummaryKey(await vo(),r);Ug(t),await wO(t);break}case"SEEK_TO_TIME":{Z.default.tabs.update(r.tabId,{url:r.link});break}case"REPORT_ERROR":{zg.reportError(r.errorEvent);break}case"GET_MODELS":return await ul()case"BM_BATCH_RETRY":{const tabId=r.tabId,url=r.url,title=r.title;const tabs=await Z.default.tabs.query({url:url});if(tabs.length){const tab=tabs[0];Z.default.tabs.sendMessage(tab.id,{type:"SUMMARIZE_TEXT",data:{title:title,url:url,textContent:""},to:"content-script"});}break}case"BM_BATCH_CLEAR":{await Z.default.storage.local.set({bm_batch_results:[]});break}'''

if old_switch in content:
    content = content.replace(old_switch, new_switch)
    with open('background/index.js', 'w') as f:
        f.write(content)
    print('Background updated successfully!')
else:
    print('Pattern not found, searching...')
    import re
    matches = list(re.finditer(re.escape('switch(r.type)'), content))
    for m in matches[:3]:
        start = max(0, m.start() - 50)
        end = min(len(content), m.end() + 300)
        print(f'Found at {m.start()}: {content[start:end]}')