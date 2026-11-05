// Acceptance test for the Erelian benchmark region (docs/regions/erelian.md), in headless Chrome.
//  1 the region loads          4 packs, atlas, no errors; prefabs placed
//  2 the player can explore    real key presses move the player; the bridge deck and stairs are walkable
//  3 the camera works          follows the player at a sane distance, above the ground
//  4 visual depth              near detail (lod0), far detail (lod1) and the mountain ridges are all drawn
//  5 lighting                  the frame is neither clipped nor flat (luminance mean and spread)
//  6 mobile performance        phone viewport, medium tier: draw calls, triangles and download within budget
//  7 gameplay still works      an action and a melee hit in Erelian
//  plus: with the region's assets blocked, the game still starts and plays (graceful degradation)
// Screenshots go to production/qa/evidence/region-erelian/. Software rendering: frame times are not measured here
// (see production/qa/mobile-perf-test-plan.md for real devices).
// Usage: CHROME=/path/to/chrome node integration/region-erelian.js   (exit code 1 on failure)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { serveThree, serveAssets } = require('../helpers/serve-three');
const { waitForStart } = require('../helpers/wait-start');

const ROOT = path.join(__dirname, '..', '..');
const GAME = require('../../tools/build').assembleGame();
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const OUT = path.join(ROOT, 'production', 'qa', 'evidence', 'region-erelian');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Budgets: ERANDEL_ART_BIBLE.md §16.2 (whole scene in view on a phone: 250 draw calls, 300k triangles).
const BUDGET = { phoneCalls: 250, phoneTris: 300000, downloadBytes: 1.6 * 1024 * 1024 };
const failures = [];
const check = (ok, what) => { if (!ok) failures.push(what); console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); };

async function open(browser, viewport, { blockAssets = false, query = '' } = {}) {
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (u.split('?')[0] === 'https://erandel.test/') return r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>' + GAME + '</body></html>' });
    if (blockAssets && u.includes('/assets/game/')) return r.abort();
    if (serveAssets(r) || serveThree(r)) return;
    return r.abort();
  });
  await page.setViewport(viewport);
  await page.goto('https://erandel.test/' + query, { waitUntil: 'load' }); await waitForStart(page);
  await page.evaluate(() => document.querySelector('[data-act="begin"]').click()); await wait(800);
  return { page, errors };
}
async function goTo(page, x, z, yaw, pitch, night) {
  await page.evaluate((x, z, yaw, pitch, night) => { ui.dialog = null; ui.banner = null; S.used = night ? 2 : 0; S.pos = { x, z }; window.__teleport = true; W3.grace = 1e9; W3.cam.yaw = yaw; W3.cam.pitch = pitch; render(); }, x, z, yaw, pitch, night);
  for (let i = 0; i < 4; i++) {
    try { await page.waitForFunction((x, z) => Math.hypot(W3.player.x - x, W3.player.z - z) < 1.5 && Math.hypot(W3.camera.position.x - x, W3.camera.position.z - z) < 20, { timeout: 8000, polling: 100 }, x, z); break; }
    catch (e) { await page.evaluate((x, z) => { S.pos = { x, z }; window.__teleport = true; }, x, z); }
  }
  await wait(night ? 6000 : 3000);
}
// In the page: draw-call and triangle count of one plain render, what is drawn, and the frame's luminance stats.
function frameStats() {
  W3.camera.updateMatrixWorld(); updateSets(W3.camera);
  const R = W3.renderer; R.info.autoReset = false; R.info.reset(); R.render(W3.scene, W3.camera);
  const out = { calls: R.info.render.calls, tris: R.info.render.triangles };
  const gl = R.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(4);
  let n = 0, s = 0, s2 = 0, clip = 0;
  for (let j = 1; j < 24; j++) for (let i = 1; i < 32; i++) { gl.readPixels(Math.floor(w * i / 32), Math.floor(h * j / 24), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const l = (0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]) / 255; n++; s += l; s2 += l * l; if (l < 0.02 || l > 0.98) clip++; }
  R.info.autoReset = true;
  const lod = { lod0: 0, lod1: 0 }; REGION.sets.forEach((set) => set.lods.forEach((parts, li) => parts.forEach((pt) => { if (pt.m.visible) lod['lod' + li] += pt.m.count; })));
  return { ...out, lum: +(s / n).toFixed(3), spread: +Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)).toFixed(3), clipped: +(clip / n).toFixed(3), lod, mountains: !!(REGION.mtn && REGION.mtn.visible) };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

  // ---------- desktop ----------
  const { page, errors } = await open(browser, { width: 1280, height: 720 });
  await page.waitForFunction(() => REGION.status === 'ready' || REGION.status === 'failed', { timeout: 120000 });
  const st = await page.evaluate(() => ({ status: REGION.status, loaded: REGION.loaded.slice(), errors: REGION.errors.slice(), tier: REGION.tier, counts: Object.fromEntries(REGION.sets.map((s) => [s.name, s.n])) }));
  const sum = (re) => Object.entries(st.counts).filter(([k]) => re.test(k)).reduce((a, [, v]) => a + v, 0);
  check(st.status === 'ready' && st.loaded.length === 4 && !st.errors.length, `1 region loads: ${st.status}, packs ${st.loaded.length}/4, tier ${st.tier}${st.errors.length ? ', errors ' + st.errors.join('; ') : ''}`);
  check(sum(/tree/) >= 60 && sum(/grass|flowers|fern|reeds|bush/) >= 800 && sum(/spire|ruin|stairs|bridge/) >= 14 && sum(/rock|boulder|log/) >= 60, `1 prefabs placed: trees ${sum(/tree/)}, ground cover ${sum(/grass|flowers|fern|reeds|bush/)}, structures ${sum(/spire|ruin|stairs|bridge/)}, rocks ${sum(/rock|boulder|log/)}`);

  // 2 explore: real key presses
  // Software rendering runs at a few frames per second and the game caps each frame's step at 0.05 s,
  // so walking is judged against simulated time (the sum of capped frame steps), not wall time.
  await goTo(page, -40, 6, Math.PI / 2, 0.32, false);
  await page.evaluate(() => { window.__sim = 0; let last = performance.now(); const tick = (now) => { window.__sim += Math.min((now - last) / 1000, 0.05); last = now; if (window.__simOn) requestAnimationFrame(tick); }; window.__simOn = true; requestAnimationFrame(tick); });
  const before = await page.evaluate(() => [W3.player.x, W3.player.z]);
  await page.keyboard.down('w'); await wait(3500); await page.keyboard.up('w'); await wait(200);
  const after = await page.evaluate(() => { window.__simOn = false; return [W3.player.x, W3.player.z, window.__sim]; });
  const moved = Math.hypot(after[0] - before[0], after[1] - before[1]), speed = moved / Math.max(after[2], 0.01);
  check(moved > 0.2 && speed > 1.5, `2 player walks with W: ${moved.toFixed(1)} m in ${after[2].toFixed(2)} s of game time (${speed.toFixed(1)} m/s)`);
  await goTo(page, -39.8, 20, 0.3, 0.3, false);
  const deck = await page.evaluate(() => ({ y: W3.player.y, deck: bridgeY(W3.player.x, W3.player.z), terrain: heightAt(W3.player.x, W3.player.z) }));
  check(Math.abs(deck.y - deck.deck) < 0.15 && deck.deck > deck.terrain + 1, `2 bridge deck is walkable: player y ${deck.y.toFixed(2)}, deck ${deck.deck.toFixed(2)}, river bed ${deck.terrain.toFixed(2)}`);
  await page.screenshot({ path: path.join(OUT, 'desktop-03-bridge.png') });
  await goTo(page, -59, 8, Math.PI / 2, 0.4, false);
  const stair = await page.evaluate(() => W3.player.y);
  check(stair > 3 && stair < 5, `2 stairs are walkable: player y ${stair.toFixed(2)} halfway up (expected 3-5)`);
  await page.screenshot({ path: path.join(OUT, 'desktop-04-stairs.png') });

  // 3 camera, 4 depth, 5 light: the falls and the forest by day, the city at night
  const views = [['desktop-01-arrival', -32, 2, Math.PI / 2, 0.42, false], ['desktop-02-falls', -50, 20, Math.PI / 2, 0.25, false], ['desktop-05-forest', -44, -4, 1.9, 0.3, false], ['desktop-06-plateau', -66, 14, -1.2, 0.3, false], ['desktop-07-night-falls', -50, 20, Math.PI / 2, 0.25, true], ['desktop-08-night-city', -48, 4, 1.2, 0.3, true]];
  for (const [name, x, z, yaw, pitch, night] of views) {
    await goTo(page, x, z, yaw, pitch, night);
    const cam = await page.evaluate(() => { const c = W3.camera.position, p = W3.player; return { d: Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z), above: c.y - Math.max(heightAt(c.x, c.z), 0) }; });
    const f = await page.evaluate(frameStats);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    console.log(`     ${name}: ${f.calls} calls, ${Math.round(f.tris / 1000)}k tris, lod0 ${f.lod.lod0}, lod1 ${f.lod.lod1}, luminance ${f.lum} ± ${f.spread}, clipped ${f.clipped}`);
    check(cam.d > 3 && cam.d < 40 && cam.above > 0.2, `3 camera follows (${name}): ${cam.d.toFixed(1)} m from the player, ${cam.above.toFixed(1)} m above ground`);
    check(f.lod.lod0 > 20 && f.lod.lod1 > 5 && f.mountains, `4 depth (${name}): near ${f.lod.lod0}, far ${f.lod.lod1}, mountains ${f.mountains}`);
    check(f.clipped < 0.08 && f.spread > 0.05 && f.lum > (night ? 0.04 : 0.18) && f.lum < 0.85, `5 lighting (${name}): mean ${f.lum}, spread ${f.spread}, clipped ${f.clipped}`);
  }

  // 7 gameplay in Erelian: an action, and a melee hit on a creature
  await goTo(page, -46, 2, 0, 0.32, false);
  const act = await page.evaluate(() => { const used = S.used; doAction('explore'); return { before: used, after: S.used, region: S.region }; });
  check(act.after === act.before + 1 && act.region === 'greenmere', `7 an action works in Erelian: actions ${act.before} -> ${act.after} (region ${act.region})`);
  // Melee, as the browser smoke test does it: stand at an Erelian creature's home, bring it next to the player, swing.
  const idx = await page.evaluate(() => { const m = W3.monsters.find((o) => o.alive && o.region === 'greenmere' && heightAt(o.hx, o.hz) > 0.6); if (!m) return -1; S.pos = { x: m.hx, z: m.hz + 3 }; window.__teleport = true; render(); return W3.monsters.indexOf(m); });
  await wait(1500);
  const hit = idx < 0 ? { ok: false } : await page.evaluate((idx) => { const w = W3, p = w.player, m = w.monsters[idx]; ui.banner = null; m.x = p.x + 0.9; m.z = p.z - 1.2; w.target = m; const hp0 = m.hp; p.cd.atk = 0; playerAttack(); return { ok: true, name: m.b.n, hp0, hp1: m.hp }; }, idx);
  check(hit.ok && hit.hp1 < hit.hp0, `7 melee works in Erelian: ${hit.name || 'no creature'} hp ${hit.hp0} -> ${hit.hp1}`);
  check(!errors.length, `no page errors on desktop${errors.length ? ': ' + errors.join('; ') : ''}`);
  await page.close();

  // ---------- 6 phone ----------
  const phone = await open(browser, { width: 412, height: 860, isMobile: true, hasTouch: true });
  await phone.page.waitForFunction(() => REGION.status === 'ready' || REGION.status === 'failed', { timeout: 120000 });
  const ptier = await phone.page.evaluate(() => REGION.tier);
  let worst = { calls: 0, tris: 0 };
  for (const [name, x, z, yaw, pitch, night] of [['phone-01-falls', -50, 20, Math.PI / 2, 0.25, false], ['phone-02-forest', -44, -4, 1.9, 0.3, false], ['phone-03-bridge', -39.8, 20, 0.3, 0.3, false], ['phone-04-night', -48, 4, 1.2, 0.3, true]]) {
    await goTo(phone.page, x, z, yaw, pitch, night);
    const f = await phone.page.evaluate(frameStats);
    await phone.page.screenshot({ path: path.join(OUT, name + '.png') });
    console.log(`     ${name}: ${f.calls} calls, ${Math.round(f.tris / 1000)}k tris`);
    if (f.calls > worst.calls) worst.calls = f.calls; if (f.tris > worst.tris) worst.tris = f.tris;
  }
  const bytes = ['erelian/env_erelian_ruins.glb', 'erelian/env_erelian_rocks.glb', 'erelian/veg_erelian_trees.glb', 'erelian/veg_all_groundcover.glb', 'all/tex_all_foliage-atlas.ktx2'].reduce((a, f) => a + fs.statSync(path.join(ROOT, 'assets', 'game', f)).size, 0);
  check(ptier === 'medium', `6 phones get the medium tier: ${ptier}`);
  check(worst.calls <= BUDGET.phoneCalls && worst.tris <= BUDGET.phoneTris, `6 phone budget: worst ${worst.calls} draw calls (<= ${BUDGET.phoneCalls}), ${Math.round(worst.tris / 1000)}k triangles (<= ${BUDGET.phoneTris / 1000}k)`);
  check(bytes <= BUDGET.downloadBytes, `6 region download ${(bytes / 1024).toFixed(0)} KB (<= ${(BUDGET.downloadBytes / 1024).toFixed(0)} KB)`);
  check(!phone.errors.length, `no page errors on phone${phone.errors.length ? ': ' + phone.errors.join('; ') : ''}`);
  await phone.page.close();

  // ---------- other regions unchanged: the old world's props outside Erelian match ?region=off ----------
  const propCounts = async (query) => { const o = await open(browser, { width: 800, height: 600 }, { query }); const c = await o.page.evaluate(() => { const r = {}; W3.scene.traverse((m) => { if (m.isInstancedMesh && !m.name) { const k = Object.keys(GEO).find((g) => GEO[g] === m.geometry); if (!k) return; const mx = new THREE.Matrix4(), p = new THREE.Vector3(); let n = 0; for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, mx); p.setFromMatrixPosition(mx); if (regionAt(p.x, p.z) !== 'greenmere') n++; } r[k] = n; } }); return r; }); await o.page.close(); return c; };
  const withRegion = await propCounts(''), without = await propCounts('?region=off');
  const kinds = Object.keys(without);
  check(kinds.length >= 8 && kinds.every((k) => withRegion[k] === without[k]), `8 every old prop outside Erelian unchanged: ${kinds.map((k) => `${k.slice(1)} ${withRegion[k]}/${without[k]}`).join(', ')}`);

  // ---------- graceful degradation: assets blocked ----------
  const off = await open(browser, { width: 800, height: 600 }, { blockAssets: true });
  await off.page.waitForFunction(() => REGION.status === 'ready' || REGION.status === 'failed', { timeout: 60000 });
  await goTo(off.page, -46, 2, 0, 0.32, false);
  const b0 = await off.page.evaluate(() => [W3.player.x, W3.player.z]); await off.page.keyboard.down('w'); await wait(1500); await off.page.keyboard.up('w');
  const b1 = await off.page.evaluate(() => ({ p: [W3.player.x, W3.player.z], status: REGION.status }));
  check(b1.status === 'failed' && Math.hypot(b1.p[0] - b0[0], b1.p[1] - b0[1]) > 1 && !off.errors.length, `assets blocked: region ${b1.status}, the game still plays (moved ${Math.hypot(b1.p[0] - b0[0], b1.p[1] - b0[1]).toFixed(1)} m), page errors ${off.errors.length}`);
  await off.page.close();

  await browser.close();
  if (failures.length) { console.error('\nFAIL\n' + failures.join('\n')); process.exit(1); }
  console.log('\nPASS - Erelian loads, explores, looks and performs within budget, and the game still plays');
})();
