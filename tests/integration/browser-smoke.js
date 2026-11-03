// Real-browser smoke test: loads src/index.html in headless Chrome with software WebGL,
// serves three.js + bloom from node_modules, walks through the main screens,
// simulates a full night market, and saves screenshots to production/qa/evidence/.
//
// Usage: CHROME=/path/to/chrome node integration/browser-smoke.js
// (defaults to /usr/bin/google-chrome). Exit code 1 on any page error.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..', '..');
const GAME = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
const MODS = path.join(__dirname, '..', 'node_modules');
const OUT = path.join(ROOT, 'production', 'qa', 'evidence');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function serve(req) {
  const u = req.url();
  if (u.startsWith('https://erandel.test/')) {
    return req.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}</style></head><body>' + GAME + '</body></html>' });
  }
  if (u.includes('three.min.js')) return req.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(MODS, 'three/build/three.min.js'), 'utf8') });
  const m = u.match(/three@0\.128\.0\/(examples\/js\/.+\.js)$/);
  if (m) return req.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(MODS, 'three', m[1]), 'utf8') });
  return req.abort();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const failures = [];
  for (const [name, viewport] of [['phone', { width: 412, height: 860, isMobile: true, hasTouch: true }], ['desktop', { width: 1280, height: 720 }]]) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => failures.push(`${name}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) failures.push(`${name}: ${m.text()}`); });
    await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
    await page.setRequestInterception(true);
    page.on('request', serve);
    await page.setViewport(viewport);
    await page.goto('https://erandel.test/', { waitUntil: 'load' });
    await wait(2500);
    const shot = (n) => page.screenshot({ path: path.join(OUT, `${name}-${n}.png`) });
    if (!(await page.evaluate(() => HAS3D))) failures.push(`${name}: WebGL world did not start`);
    await shot('01-threshold');
    await page.evaluate(() => document.querySelector('[data-act="begin"]').click());
    await wait(1500); await shot('02-spawn-aelarion');
    await page.evaluate(() => { ui.dialog = null; S.pos = { x: 14, z: 44 }; window.__teleport = true; W3.grace = 1e9; render(); });
    await wait(2000); await page.evaluate(() => { ui.banner = null; render(); }); await wait(300); await shot('03-plot-day');
    await page.evaluate(() => { S.used = 2; render(); }); await wait(3000); await shot('04-plot-night');
    const market = await page.evaluate(() => {
      S.used = 1; doAction('sp', 'market');
      for (let i = 0; i < 6000 && ui.market; i++) updateCustomers(0.05, i * 0.05);
      return { sold: S.salesToday, cap: S.salesCap, open: !!ui.market };
    });
    if (market.sold !== market.cap || market.open) failures.push(`${name}: market did not complete ${JSON.stringify(market)}`);
    await page.evaluate(() => { S.gold += 500; S.mat.wood += 40; S.mat.stone += 20; document.querySelector('[data-act="build-open"]').click(); buildPlace('torii', 1, 7, 0); buildPlace('teahouse', 4, 6, 0); W3.hover = { c: 12, r: 1 }; ui.build.sel = 'shoji'; render(); });
    await wait(1500); await shot('05-build-mode');
    await page.evaluate(() => { ui.build = null; S.pos = { x: -38, z: 12 }; window.__teleport = true; render(); });
    await wait(2500); await page.evaluate(() => { ui.banner = null; render(); }); await wait(200); await shot('06-erelian-night');
    await page.evaluate(() => { ui.journal = true; render(); }); await wait(300); await shot('07-journal');
    await page.close();
  }
  await browser.close();
  if (failures.length) { console.error('FAIL\n' + failures.join('\n')); process.exit(1); }
  console.log(`PASS - screenshots in ${path.relative(ROOT, OUT)}`);
})();
