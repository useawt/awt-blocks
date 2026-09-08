const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [cookieFile, pageId] = process.argv.slice(2);
  const raw = fs.readFileSync(cookieFile,'utf8').trim();
  const cookies = raw.split('; ').map(kv => { const i = kv.indexOf('='); return { name: kv.slice(0,i), value: kv.slice(i+1), domain: 'localhost', path: '/' }; });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
  await ctx.addCookies(cookies);
  const p = await ctx.newPage();
  await p.goto(`${pageId}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(15000);
  const frame = p.frames().find(f => f.name() === 'editor-canvas');
  if (!frame) { console.log('no canvas frame'); await b.close(); return; }
  const found = await frame.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      const mi = getComputedStyle(el).maskImage;
      if (!mi || mi === 'none' || !mi.includes('carbon-icons')) continue;
      const urls = [...mi.matchAll(/url\("?([^")]+)"?\)/g)].map(m => m[1]);
      const owner = el.closest('[data-type]');
      out.push({ block: owner ? owner.getAttribute('data-type') : '(none)', urls });
    }
    return out;
  });
  console.log('mask-drawn icons in canvas:', found.length);
  const seen = new Set();
  for (const f of found) {
    const key = f.block + '|' + f.urls[0];
    if (seen.has(key)) continue; seen.add(key);
    const codes = [];
    for (const u of f.urls) {
      const r = await p.request.get(u).catch(() => null);
      codes.push(r ? r.status() : 'ERR');
    }
    const ok = codes.includes(200);
    console.log((ok ? 'OK  ' : 'FAIL'), f.block.padEnd(22), codes.join('/'), f.urls[0].split('/carbon-icons/')[1]);
  }
  // also count inline svgs per block type in the canvas
  const svgs = await frame.evaluate(() => {
    const m = {};
    for (const el of document.querySelectorAll('svg')) {
      const owner = el.closest('[data-type]');
      const k = owner ? owner.getAttribute('data-type') : '(none)';
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  });
  console.log('\ninline svgs per block in canvas:', JSON.stringify(svgs));
  await b.close();
})();
