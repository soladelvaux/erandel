// Start-up fallbacks (docs/architecture/architecture.md, External dependencies), real browser:
//   1. the bloom add-ons fail to load  -> the 3D world still starts, without bloom
//   2. three.js itself fails to load   -> the game starts in the 2D journal mode
// Usage: CHROME=/path/to/chrome node integration/fallback-smoke.js   (exit code 1 on failure)
const puppeteer = require('puppeteer-core');
const { serveThree } = require('../helpers/serve-three');
const { waitForStart } = require('../helpers/wait-start');

const GAME = require('../../tools/build').assembleGame();
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(browser, block) {
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (u.startsWith('https://erandel.test/')) return r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>' + GAME + '</body></html>' });
    if (block.test(u)) return r.abort();
    if (serveThree(r)) return;
    return r.abort();
  });
  await page.setViewport({ width: 800, height: 600 });
  await page.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(page); await wait(500);
  const state = await page.evaluate(() => ({ has3d: HAS3D, world: !!(W3 && W3.renderer), bloom: !!(W3 && W3.composer), begin: !!document.querySelector('[data-act="begin"]') }));
  await page.close();
  return { state, errors };
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 120000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const failures = [];
  const noBloom = await open(browser, /examples\/jsm\/postprocessing\//);
  if (!noBloom.state.has3d || !noBloom.state.world || noBloom.state.bloom || !noBloom.state.begin) failures.push('bloom add-ons blocked: expected the 3D world without bloom, got ' + JSON.stringify(noBloom));
  const noThree = await open(browser, /three@[\d.]+\/build\//);
  if (noThree.state.has3d || noThree.state.world || !noThree.state.begin) failures.push('three.js blocked: expected the 2D journal mode, got ' + JSON.stringify(noThree));
  // An attack, skill or dodge pressed before the first frame has built the player's character must do
  // nothing rather than throw (seen intermittently in the two-player test on a slow machine, 2026-11-05).
  { const page = await browser.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
    await page.setRequestInterception(true);
    page.on('request', (r) => { const u = r.url(); if (u.startsWith('https://erandel.test/')) return r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>' + GAME + '</body></html>' }); if (serveThree(r)) return; return r.abort(); });
    await page.setViewport({ width: 800, height: 600 }); await page.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(page); await wait(500);
    const early = await page.evaluate(() => { document.querySelector('[data-act="begin"]').click(); ui.dialog = null; ui.fadeText = null; ui.banner = null; const p = W3.player, ch = p.ch; p.ch = null; try { W3.grace = 1e9; playerAttack(); playerDodge(); return { ok: true }; } catch (e) { return { ok: false, err: e.message }; } finally { p.ch = ch; } });
    await page.close();
    if (!early.ok || errs.length) failures.push('attack before the character exists threw: ' + JSON.stringify({ early, errs })); }
  await browser.close();
  if (failures.length) { console.error('FAIL\n' + failures.join('\n')); process.exit(1); }
  console.log('PASS - without bloom files the 3D world starts without bloom; without three.js the 2D journal starts');
})();
