// Phase 7 QA probe (production/qa/phase7-qa-report.md). Loads the game in headless Chrome on a desktop
// viewport and an emulated Android phone, at each graphics tier, and records: load time to playable,
// asset load status, console and page errors, failed or missing requests, JS heap, GPU objects, draw
// calls and triangles per scene, frame time, and screenshots. Then runs gameplay probes (movement,
// camera, NPC talk, journal, save and reload, corrupted saves, touch controls).
//
// Frame times come from software rendering (swiftshader), so they compare tiers with each other, not
// with a real phone (production/qa/mobile-perf-test-plan.md has the real-device procedure).
//
// Usage: CHROME=/path/to/chrome node integration/qa-probe.js [--live]
//   --live  probes the public site (real network, real CDN); otherwise the local build is served.
// Writes production/qa/phase7/probe.json and screenshots in production/qa/evidence/phase7/.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { serveThree, serveAssets } = require('../helpers/serve-three');
const { waitForStart } = require('../helpers/wait-start');

const ROOT = path.join(__dirname, '..', '..');
const LIVE = process.argv.includes('--live');
const URL0 = LIVE ? 'https://soladelvaux.github.io/erandel/' : 'https://erandel.test/';
const GAME = LIVE ? null : require('../../tools/build').assembleGame();
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const SHOTS = path.join(ROOT, 'production', 'qa', 'evidence', 'phase7');
const OUTF = path.join(ROOT, 'production', 'qa', 'phase7', LIVE ? 'probe-live.json' : 'probe-local.json');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ONLY = process.env.QA_ONLY || '';

function serve(req) {
  const u = req.url();
  if (u.startsWith('https://erandel.test/')) {
    if (serveAssets(req)) return;
    return req.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}</style></head><body>' + GAME + '</body></html>' });
  }
  if (serveThree(req)) return;
  return req.abort();
}

const DEVICES = {
  desktop: { viewport: { width: 1280, height: 720 } },
  android: { viewport: { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }, ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' },
};

async function openGame(browser, dev, tier, log) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const D = DEVICES[dev];
  if (D.ua) await page.setUserAgent(D.ua);
  await page.setViewport(D.viewport);
  page.on('pageerror', (e) => log.errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error') log.errors.push('console: ' + t); else if (m.type() === 'warning') log.warnings.push(t); });
  page.on('requestfailed', (r) => { if (!/favicon/.test(r.url())) log.failed.push(r.url() + ' ' + (r.failure() && r.failure().errorText)); });
  page.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) log.failed.push(r.status() + ' ' + r.url()); else log.bytes += +(r.headers()['content-length'] || 0); });
  if (!LIVE) { await page.setRequestInterception(true); page.on('request', serve); }
  const t0 = Date.now();
  await page.goto(URL0 + '?gfx=' + tier, { waitUntil: 'load', timeout: 180000 });
  log.t.pageLoad = Date.now() - t0;
  await waitForStart(page, 180000); log.t.started = Date.now() - t0;
  return { ctx, page, t0 };
}

async function begin(page) {
  await page.evaluate(() => { const b = document.querySelector('[data-act="begin"]'); if (b) b.click(); });
  await page.waitForFunction(() => ui.screen === 'game' && W3 && W3.player, { timeout: 60000 });
}

function measure() {
  const w = W3, R = w.renderer;
  R.info.autoReset = false; R.info.reset(); if (w.composer) w.composer.render(); else R.render(w.scene, w.camera);
  const r = { calls: R.info.render.calls, tris: R.info.render.triangles, programs: R.info.programs.length, geometries: R.info.memory.geometries, textures: R.info.memory.textures, pixelRatio: R.getPixelRatio() };
  R.info.autoReset = true; return r;
}
async function frameTime(page, ms) {
  return page.evaluate((ms) => new Promise((res) => { const ts = []; const t0 = performance.now(); const f = (t) => { ts.push(t); if (t - t0 < ms) requestAnimationFrame(f); else { const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b); res({ frames: d.length, median: Math.round(d[d.length >> 1] || 0), p95: Math.round(d[Math.floor(d.length * 0.95)] || 0) }); } }; requestAnimationFrame(f); }), ms);
}
async function heap(page) {
  const c = await page.target().createCDPSession(); await c.send('Performance.enable'); const m = (await c.send('Performance.getMetrics')).metrics; const g = (n) => (m.find((x) => x.name === n) || {}).value || 0;
  return { jsHeapMB: +(g('JSHeapUsedSize') / 1048576).toFixed(1), jsHeapTotalMB: +(g('JSHeapTotalSize') / 1048576).toFixed(1), nodes: g('Nodes') };
}
async function goTo(page, x, z, yaw) {
  await page.evaluate((x, z, yaw) => { ui.dialog = null; ui.banner = null; ui.journal = false; S.pos = { x, z }; window.__teleport = true; W3.grace = 1e9; if (yaw != null) W3.cam.yaw = yaw; render(); }, x, z, yaw);
  await page.waitForFunction((x, z) => Math.hypot(W3.player.x - x, W3.player.z - z) < 1.5, { timeout: 90000, polling: 200 }, x, z);
  await wait(2500); await page.evaluate(() => { ui.banner = null; ui.toast = ''; render(); }); await wait(400);
}

const SCENES = [['spawn', 0, 60, 0], ['erelian', -44, 4, 0.6], ['plot', 14, 44, -0.4]];

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true }); fs.mkdirSync(path.dirname(OUTF), { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 120000, protocolTimeout: 600000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const out = { live: LIVE, url: URL0, date: new Date().toISOString(), runs: [], gameplay: {} };
  for (const dev of ['desktop', 'android']) for (const tier of ['low', 'medium', 'high']) {
    if (ONLY && !ONLY.split(',').includes(dev + '-' + tier)) continue;
    const log = { dev, tier, t: {}, errors: [], warnings: [], failed: [], bytes: 0, scenes: {} };
    try {
      const { ctx, page, t0 } = await openGame(browser, dev, tier, log);
      await begin(page); log.t.inWorld = Date.now() - t0;
      await page.waitForFunction(() => REGION.status === 'ready' || REGION.status === 'failed', { timeout: 240000, polling: 250 }).catch(() => {});
      log.t.regionReady = Date.now() - t0;
      await page.waitForFunction(() => ['ready', 'partial', 'failed'].includes(CHR.status), { timeout: 240000, polling: 250 }).catch(() => {});
      log.t.charsReady = Date.now() - t0;
      log.assets = await page.evaluate(() => ({ region: REGION.status, loaded: REGION.loaded, regionErrors: REGION.errors, chars: CHR.status, charErrors: CHR.errors || [], tier: gfxTier(), phone: IS_PHONE, bloom: !!W3.composer, has3d: HAS3D }));
      for (const [name, x, z, yaw] of SCENES) {
        await goTo(page, x, z, yaw);
        const m = await page.evaluate(measure); m.frame = await frameTime(page, 2500);
        log.scenes[name] = m;
        await page.screenshot({ path: path.join(SHOTS, `${dev}-${tier}-${name}.png`) });
      }
      log.heap = await heap(page);
      // gameplay probes once per device, at the default tier
      if ((dev === 'desktop' && tier === 'high') || (dev === 'android' && tier === 'medium')) out.gameplay[dev] = await gameplay(page, dev, log);
      await ctx.close();
    } catch (e) { log.errors.push('probe: ' + e.message); }
    out.runs.push(log);
    console.log(`${dev}/${tier}: inWorld ${log.t.inWorld}ms region ${log.t.regionReady}ms chars ${log.t.charsReady}ms ` + Object.entries(log.scenes).map(([k, v]) => `${k} ${v.calls}dc ${Math.round(v.tris / 1000)}k ${v.frame.median}ms`).join(' | ') + ` heap ${log.heap && log.heap.jsHeapMB}MB errors ${log.errors.length} failed ${log.failed.length}`);
  }
  out.corruptSaves = await corruptSaves(browser);
  fs.writeFileSync(OUTF, JSON.stringify(out, null, 1));
  await browser.close();
  console.log('wrote ' + path.relative(ROOT, OUTF));
})();

async function gameplay(page, dev, log) {
  const g = {};
  const shot = (n) => page.screenshot({ path: path.join(SHOTS, `${dev}-play-${n}.png`) });
  // movement: hold forward 1.5 s
  await goTo(page, 0, 58, 0);
  const p0 = await page.evaluate(() => ({ x: W3.player.x, z: W3.player.z, t: W3.clock.elapsedTime }));
  if (dev === 'android') {
    const box = await page.evaluate(() => { const r = document.getElementById('stick').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, vis: getComputedStyle(document.getElementById('controls')).display !== 'none' && !document.getElementById('controls').hidden }; });
    g.stickVisible = box.vis; g.stickSize = Math.round(box.w);
    const c = await page.target().createCDPSession();
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y, id: 1 }] });
    await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x, y: box.y - box.w / 2, id: 1 }] });
    await page.waitForFunction((t0) => W3.clock.elapsedTime - t0 > 1.5, { timeout: 120000, polling: 100 }, p0.t);
    g.stickDuring = await page.evaluate(() => ({ x: stick.x, y: stick.y }));
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(300); g.stickAfter = await page.evaluate(() => ({ x: stick.x, y: stick.y }));
    // touch buttons: attack and jump respond
    const btn = async (id) => page.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: Math.round(r.width), h: Math.round(r.height) }; }, id);
    const atk = await btn('b-atk'), jmp = await btn('b-jump'), dg = await btn('b-dodge');
    g.buttonSizes = { attack: [atk.w, atk.h], jump: [jmp.w, jmp.h], dodge: [dg.w, dg.h] };
    await page.evaluate(() => { W3.player.cd.atk = 0; window.__atk0 = W3.player.atkT || 0; window.__anim0 = W3.player.anim; });
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: atk.x, y: atk.y, id: 2 }] }); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(200); g.touchAttack = await page.evaluate(() => W3.player.cd.atk > 0);
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jmp.x, y: jmp.y, id: 3 }] }); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(150); g.touchJump = await page.evaluate(() => !W3.player.ground || W3.player.vy !== 0);
    // drag on the scene to turn the camera
    const yaw0 = await page.evaluate(() => W3.cam.yaw);
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y: 300, id: 4 }] });
    for (let i = 1; i <= 6; i++) await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 300 - i * 20, y: 300, id: 4 }] });
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(300); g.touchCameraYaw = +((await page.evaluate(() => W3.cam.yaw)) - yaw0).toFixed(3);
    // overlap check: no two HUD controls overlap
    g.hudOverlaps = await page.evaluate(() => { const els = ['stick', 'b-atk', 'b-jump', 'b-dodge', 'b-talk', 'mpbar'].map((id) => [id, document.getElementById(id)]).filter((e) => e[1] && e[1].offsetParent); const sk = [...document.querySelectorAll('#btns .sk')].filter((b) => b.offsetParent).map((b, i) => ['sk' + i, b]); const all = els.concat(sk).map(([id, e]) => [id, e.getBoundingClientRect()]); const o = []; for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i][1], b = all[j][1]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) o.push(all[i][0] + '/' + all[j][0]); } return o; });
    g.offscreen = await page.evaluate(() => [...document.querySelectorAll('#controls button, #hud *')].filter((e) => e.offsetParent).filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1; }).map((e) => e.id || e.className).slice(0, 8));
  } else {
    await page.keyboard.down('w');
    await page.waitForFunction((t0) => W3.clock.elapsedTime - t0 > 1.5, { timeout: 120000, polling: 100 }, p0.t);
    await page.keyboard.up('w');
    // camera drag with the mouse
    const yaw0 = await page.evaluate(() => W3.cam.yaw);
    await page.mouse.move(640, 360); await page.mouse.down(); for (let i = 1; i <= 6; i++) await page.mouse.move(640 - i * 25, 360); await page.mouse.up();
    await wait(300); g.mouseCameraYaw = +((await page.evaluate(() => W3.cam.yaw)) - yaw0).toFixed(3);
    const z0 = await page.evaluate(() => W3.zoom); await page.mouse.wheel({ deltaY: 400 }); await wait(300); g.wheelZoom = +((await page.evaluate(() => W3.zoom)) - z0).toFixed(3);
  }
  const p1 = await page.evaluate(() => ({ x: W3.player.x, z: W3.player.z, anim: W3.player.anim, t: W3.clock.elapsedTime }));
  g.moved = +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(2); g.moveSeconds = +(p1.t - p0.t).toFixed(2);
  // NPC: walk to Aelarion and talk
  const ael = await page.evaluate(() => { const n = W3.npcs.find((o) => o.id === 'ael') || W3.npcs[0]; return { id: n.id, x: n.x, z: n.z }; });
  await goTo(page, ael.x, ael.z + 2.2, 0);
  g.talkReady = await page.evaluate(() => !document.getElementById('b-talk').disabled);
  if (dev === 'desktop') { await page.keyboard.press('e'); } else { await page.evaluate(() => document.getElementById('b-talk').click()); }
  await wait(800);
  g.talk = await page.evaluate(() => ({ dialog: ui.dialog && ui.dialog.type, text: (document.querySelector('.dlg, #dialog, .dialog') || {}).textContent || '' }));
  g.talk.text = g.talk.text.slice(0, 160);
  await shot('npc-talk');
  // journal (inventory, quests, spells)
  await page.evaluate(() => { ui.dialog = null; ui.journal = true; render(); }); await wait(600); await shot('journal');
  g.journal = await page.evaluate(() => { const t = document.body.innerText; return { gold: /gold/i.test(t), wood: /wood/i.test(t), spells: /spell/i.test(t) }; });
  await page.evaluate(() => { ui.journal = false; render(); });
  // equipment: is there any?
  g.equipment = await page.evaluate(() => ({ stateField: S && ('equip' in S || 'gear' in S || 'equipment' in S), ui: /equip/i.test(document.body.innerHTML) }));
  // save and reload
  const before = await page.evaluate(() => { S.gold += 37; S.mat.wood += 3; save(); const s = simState(); return { gold: s.inventory.gold, wood: s.inventory.materials.wood, day: s.world.day, name: s.player.name, hp: s.player.hp }; });
  await page.reload({ waitUntil: 'load', timeout: 180000 }); await waitForStart(page, 180000); await begin(page).catch(() => {});
  const after = await page.evaluate(() => { const s = simState(); return s && { gold: s.inventory.gold, wood: s.inventory.materials.wood, day: s.world.day, name: s.player.name, hp: s.player.hp }; });
  g.saveReload = { before, after, same: JSON.stringify(before) === JSON.stringify(after) };
  return g;
}

// Corrupted or hand-edited saves must not break the game: each one either loads with defaults or
// falls back to character creation, with no page error.
async function corruptSaves(browser) {
  const cases = {
    notJson: '{"v":1,',
    nullSave: 'null',
    wrongVersion: '{"v":99}',
    spellsNotArray: 'BASE:spells="x"',
    goldString: 'BASE:gold="lots"',
    hpNaN: 'BASE:hp=null',
    statsMissing: 'BASE:stats={}',
    traitsNotArray: 'BASE:traits=5',
    npcsNull: 'BASE:npcs=null',
    flagsNull: 'BASE:flags=null',
    regRepNull: 'BASE:regRep=null',
    sourcesNull: 'BASE:sources=null',
    buildBad: 'BASE:build=[{"id":"nope","c":"a"}]',
    posBad: 'BASE:pos={"x":"a","z":null}',
    worldBad: 'BASE:world="x"',
    petBad: 'BASE:pet=7',
    logBad: 'BASE:log=[null,5]',
    huge: 'BASE:gold=1e308',
  };
  // one healthy save to mutate
  const log = { errors: [], warnings: [], failed: [], bytes: 0, t: {} };
  const { ctx, page } = await openGame(browser, 'desktop', 'low', log);
  await begin(page);
  const base = await page.evaluate(() => { save(); return localStorage.getItem(SAVE_KEY); });
  await ctx.close();
  const res = {};
  for (const [name, c] of Object.entries(cases)) {
    let raw = c;
    if (c.startsWith('BASE:')) { const [k, v] = c.slice(5).split(/=(.*)/s); const o = JSON.parse(base); o[k] = JSON.parse(v); raw = JSON.stringify(o); }
    const l = { errors: [], warnings: [], failed: [], bytes: 0, t: {} };
    const ctx2 = await browser.createBrowserContext(); const p = await ctx2.newPage(); await p.setViewport({ width: 1280, height: 720 });
    p.on('pageerror', (e) => l.errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) l.errors.push(m.text()); });
    if (!LIVE) { await p.setRequestInterception(true); p.on('request', serve); }
    await p.evaluateOnNewDocument((raw) => { if (!sessionStorage.getItem('__seeded')) { sessionStorage.setItem('__seeded', '1'); localStorage.setItem('erandel-save-v1', raw); } }, raw);
    try {
      await p.goto(URL0 + '?gfx=low', { waitUntil: 'load', timeout: 180000 }); await waitForStart(p, 180000);
      await p.evaluate(() => { const b = document.querySelector('[data-act="begin"]'); if (b) b.click(); });
      await wait(4000);
      const st = await p.evaluate(() => { let journal = null; try { ui.journal = true; render(); journal = 'ok'; ui.journal = false; render(); } catch (e) { journal = e.message; } let sim = null; try { sim = simState() ? 'ok' : 'none'; } catch (e) { sim = e.message; } try { save(); } catch (e) {} return { screen: ui.screen, loaded: !!S, journal, sim, gold: S && S.gold }; });
      res[name] = { ...st, errors: l.errors.slice(0, 3) };
    } catch (e) { res[name] = { probe: e.message, errors: l.errors.slice(0, 3) }; }
    await ctx2.close();
  }
  return res;
}
