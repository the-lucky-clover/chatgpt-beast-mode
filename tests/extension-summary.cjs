const { chromium } = require('playwright');
const { createServer } = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const root = path.resolve(__dirname, '..');
  const article = '<!doctype html><html lang="en"><head><title>Local summary verification</title></head><body><main><article><h1>Local summary verification</h1>' + '<p>The test system uses a blue sensor to measure water temperature. Install the sensor, connect its cable, and record the temperature every minute. The measured result is twenty degrees Celsius.</p>'.repeat(20) + '</article></main></body></html>';
  const server = createServer((req, res) => {res.setHeader('Content-Type', 'text/html'); res.end(article);});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let context;
  try {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium', headless: true,
      args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
      viewport: {width: 1280, height: 900}
    });
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    context.setDefaultTimeout(15000);
    await worker.evaluate(async () => {
      await chrome.storage.local.set({provider: 'api', model: 'gpt-4o', apiKey: 'test-key-not-a-real-credential', question: 'Return a TL;DR and five key points.', showSummarizeButton: false, showYoutubeButton: false});
      globalThis.summaryRequests = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (input, options) => {
        const url = String(input);
        if (url === 'https://api.openai.com/v1/chat/completions') {
          summaryRequests.push(JSON.parse(options.body));
          await new Promise(resolve => setTimeout(resolve, 1800));
          const payload = {id: 'browser-smoke', choices: [{delta: {content: 'Verified summary: install the blue sensor, connect its cable, and record water temperature every minute. Result: twenty degrees Celsius.'}, finish_reason: null}]};
          return new Response(`data: ${JSON.stringify(payload)}\n\ndata: [DONE]\n\n`, {headers: {'Content-Type': 'text/event-stream'}});
        }
        if (url === 'https://api.openai.com/v1/models') return Response.json({data: [{id: 'gpt-4o'}]});
        if (/google-analytics|calmai|caimai/.test(url)) return new Response('{}', {headers: {'Content-Type': 'application/json'}});
        return originalFetch(input, options);
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') console.log('CONSOLE', message.text().slice(0, 500)); });
    const url = `http://127.0.0.1:${server.address().port}/article`;
    await page.goto(url);
    await page.bringToFront();
    await worker.evaluate(async url => {
      const [tab] = await chrome.tabs.query({url});
      await chrome.tabs.sendMessage(tab.id, {type: 'OPEN_POPUP', to: 'content-script'});
    }, url);
    const frame = page.frameLocator('#chatgpt-summarize-popup');
    await frame.locator('.bm-progress-track').first().waitFor();
    assert.notEqual(await frame.locator('.bm-progress-fill').first().evaluate(el => getComputedStyle(el).animationName), 'none');
    try {
      await frame.locator('#gpt-answer').getByText('Verified summary:', {exact: false}).waitFor({timeout: 20000});
    } catch (error) {
      console.log('PAGE ERRORS', errors);
      for (const f of page.frames()) console.log('FRAME', f.url(), (await f.locator('body').innerText().catch(() => '')).slice(0, 2500));
      console.log('REQUEST COUNT', await worker.evaluate(() => summaryRequests.length));
      console.log('SETTINGS', await worker.evaluate(() => chrome.storage.local.get(['provider', 'model'])));
      const popupFrame = page.frames().find(f => f.url().includes('/popup/index.html'));
      if (popupFrame) console.log('POPUP STATE', await popupFrame.evaluate(async () => ({ visibility: document.visibilityState, mode: document.documentElement.dataset.bmTheme, headerError: document.querySelector('#bm-header-status')?.textContent, storage: await Promise.race([chrome.storage.local.get(['provider', 'model']), new Promise(r => setTimeout(() => r('timeout'), 2000))]), width: innerWidth, app: document.querySelector('#app').getBoundingClientRect().width })));
      throw error;
    }
    assert.equal(await frame.locator('header').count(), 1);
    assert.equal(await frame.locator('nav').count(), 1);
    await frame.locator('.bm-progress').waitFor({state:'detached'});
    const initialTitleSize = await frame.locator('.header-title').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    await frame.locator('#text-size-btn').click();
    await frame.locator('#text-size-slider').evaluate(el => {el.value='130'; el.dispatchEvent(new Event('input', {bubbles:true}));});
    await frame.locator('#text-size-value').getByText('130', {exact:true}).waitFor();
    const scaledTitleSize = await frame.locator('.header-title').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    assert.ok(scaledTitleSize > initialTitleSize * 1.25);
    await frame.locator('#text-size-btn').click();
    const requests = await worker.evaluate(() => summaryRequests);
    assert.equal(requests.length, 1);
    assert.ok(requests[0].messages.some(message => message.content.includes('blue sensor')));
    assert.ok(requests[0].messages.some(message => message.content.includes('entire summary in English')));
    const language = frame.getByRole('button', {name: 'Summary language', exact: true});
    await language.getByText('English', {exact: true}).waitFor();
    await language.click();
    await frame.getByRole('option', {name: new Intl.DisplayNames(['en'], {type: 'language'}).of('es-419'), exact: true}).waitFor();
    await frame.getByRole('option', {name: 'Spanish', exact: true}).click();
    await language.getByText('Spanish', {exact: true}).waitFor();
    await frame.locator('.bm-progress').waitFor({state: 'detached'});
    assert.equal(await worker.evaluate(() => summaryRequests.length), 2);
    const translated = await worker.evaluate(() => summaryRequests[1]);
    assert.ok(translated.messages.some(message => message.content.includes('entire summary in Spanish') && message.content.includes('blue sensor')));
    await frame.locator('.bm-progress').waitFor({state: 'detached'});
    const geometry = await frame.locator('#app').evaluate(el => ({width: el.getBoundingClientRect().width, viewport: innerWidth}));
    assert.equal(geometry.width, geometry.viewport);
    assert.deepEqual(errors, []);
    await worker.evaluate(async () => {
      const vars = {bgPrimary:'#fff6fb',bgSecondary:'#fdeef7',bgTertiary:'#f7e0f0',textPrimary:'#3a1f33',textSecondary:'#7a4d6e',textMuted:'#a781a0',accentPrimary:'#ff6fae',accentHover:'#ff4f97',accentLight:'#ffe0ef',borderColor:'#f3d4ea'};
      await chrome.storage.local.set({bm_theme:'light',bm_active_theme_id:'season-spring-bloom-bestie',bm_active_theme_vars:vars});
    });
    await frame.locator('html[data-bm-palette]').waitFor();
    await frame.locator('#theme-toggle-btn').click();
    await frame.locator('html[data-bm-theme="dark"]:not([data-bm-palette])').waitFor();
    assert.equal(await frame.locator('.bm-app').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(28, 29, 32)');
    await frame.locator('#theme-toggle-btn').click();
    await frame.locator('html[data-bm-theme="light"]').waitFor();
    assert.equal(await frame.locator('.bm-app').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
    for (const [width,height] of [[1000,800],[500,500]]) {
      await page.locator('#chatgpt-summarize-popup').evaluate((el,size) => {el.style.width = size[0]+'px'; el.style.height = size[1]+'px';}, [width,height]);
      const measured = await frame.locator('#gpt-answer').evaluate(el => ({width:el.getBoundingClientRect().width,available:innerWidth}));
      assert.ok(measured.width >= measured.available - 40, JSON.stringify(measured));
    }
    await page.screenshot({path: path.join(__dirname, 'extension-summary.png')});
    await frame.locator('#settings-btn').click();
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.ok((await worker.evaluate(() => chrome.tabs.query({}))).some(tab => tab.url?.endsWith('/options/index.html')));
    await frame.locator('#close-btn').click();
    await page.locator('#chatgpt-summarize-popup').waitFor({state:'hidden'});
    console.log('PASS: single header, working Settings/Close, slider-scaled title, animated loading progress, and progress removal on completion.');
    console.log('PASS: header theme toggle changes real summary surfaces even after a custom palette; summary uses full width at two resized dimensions.');
    console.log('PASS: real unpacked extension extracts article text, sends the model request, renders the streamed summary, and fills the popup width. Provider response is controlled; no real API credentials used.');
  } finally {
    if (context) await context.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
