const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('http://localhost:8889/?page_id=' + process.argv[2], { waitUntil: 'networkidle' }).catch(async () => {
    await p.goto('http://localhost:8889/widgets/', { waitUntil: 'networkidle' });
  });
  const before = await p.evaluate(() => [...document.querySelectorAll('.cds--modal')].map(m => m.id || '(no id)'));
  console.log('modals on the page, DOM order:', JSON.stringify(before));
  await p.getByRole('button', { name: 'Open the dialog' }).click();
  await p.waitForTimeout(500);
  console.log('after opening        :', JSON.stringify(await p.evaluate(() =>
    [...document.querySelectorAll('.cds--modal')].map(m => (m.id || '(no id)') + (m.classList.contains('is-visible') ? ' [open]' : '')))));
  console.log('first .cds--modal-close belongs to:', await p.evaluate(() =>
    document.querySelector('.cds--modal-close').closest('.cds--modal').id));
  await b.close();
})();
