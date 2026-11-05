// Performance probe: loads the game in headless Chrome and measures, per scene and viewport,
// draw calls, triangles, shader programs, geometries, textures and the objects that cause the
// draw calls (by category). Hardware-independent numbers only: headless Chrome renders in
// software, so frame times from here say nothing about a real phone (see
// production/qa/mobile-perf-test-plan.md for the real-device procedure).
//
// Usage: CHROME=/path/to/chrome node integration/perf-probe.js [label]
// Writes production/qa/baseline/perf-<label>.json and prints a summary table.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { serveThree, serveAssets } = require('../helpers/serve-three');
const { waitForStart } = require('../helpers/wait-start');

const ROOT = path.join(__dirname, '..', '..');
const GAME = process.env.PROBE_SRC ? fs.readFileSync(process.env.PROBE_SRC, 'utf8') : require('../../tools/build').assembleGame();
const MODS = path.join(__dirname, '..', 'node_modules');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const LABEL = process.argv[2] || 'current';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function serve(req) {
  const u = req.url();
  if (u.startsWith('https://erandel.test/')) return req.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>' + GAME + '</body></html>' });
  if (serveAssets(req) || serveThree(req)) return;
  return req.abort();
}

// Runs in the page: categorise every object that would issue a draw call this frame.
function measure() {
  const w = W3, R = w.renderer, cam = w.camera;
  cam.updateMatrixWorld(); const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  const owner = new Map();
  const tagTree = (root, cat) => root && root.traverse((o) => owner.set(o, cat));
  w.npcs.forEach((n) => tagTree(n.ch.g, 'people (NPC chibis)'));
  w.monsters.forEach((m) => tagTree(m.mo.g, 'creatures'));
  if (w.player.ch) tagTree(w.player.ch.g, 'player chibi');
  if (w.comp.ch) tagTree(w.comp.ch.g, 'companion');
  w.customers.forEach((c) => { tagTree(c.ch.g, 'market customers'); owner.set(c.bub, 'market customers'); });
  tagTree(w.buildGroup, 'plot build items');
  w.glows.forEach((g) => owner.set(g.s, 'glow sprites'));
  (w.wisps || []).forEach((g) => owner.set(g.s, 'glow sprites'));
  (w.flies || []).forEach((f) => tagTree(f.s, 'butterflies'));
  owner.set(w.terrain, 'terrain + water'); owner.set(w.water, 'terrain + water');
  if (w.sky) { owner.set(w.sky.stars, 'sky'); owner.set(w.sky.body, 'sky'); owner.set(w.sky.halo, 'sky'); }
  owner.set(w.points, 'weather particles');
  const cats = {}, heavy = [];
  const visibleUp = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  w.scene.traverse((o) => {
    if (!(o.isMesh || o.isSprite || o.isPoints || o.isLine)) return;
    if (!visibleUp(o)) return;
    if (o.isInstancedMesh && o.count === 0) return;
    if (o.frustumCulled) { if (o.isSprite ? !fr.intersectsSprite(o) : !fr.intersectsObject(o)) return; }
    const cat = o.isInstancedMesh ? 'instanced props' : owner.get(o) || (o.material && o.material.blending === THREE.AdditiveBlending ? 'effects/glows (other)' : 'landmarks + other meshes');
    const g = o.geometry; const idx = g && g.index ? g.index.count : g && g.attributes.position ? g.attributes.position.count : 0;
    const tris = o.isSprite ? 2 : o.isPoints || o.isLine ? 0 : Math.round(idx / 3) * (o.isInstancedMesh ? o.count : 1);
    const c = cats[cat] || (cats[cat] = { calls: 0, tris: 0 }); c.calls++; c.tris += tris;
    if (tris > 2000) heavy.push({ what: cat + (o.isInstancedMesh ? ' ×' + o.count : ''), geom: g && g.type, tris });
  });
  R.info.autoReset = false; R.info.reset(); R.render(w.scene, cam); const plain = { calls: R.info.render.calls, tris: R.info.render.triangles };
  R.info.reset(); if (w.composer) w.composer.render(); const withBloom = { calls: R.info.render.calls, tris: R.info.render.triangles }; R.info.autoReset = true;
  let meshes = 0, sprites = 0, inst = 0; w.scene.traverse((o) => { if (o.isInstancedMesh) inst++; else if (o.isMesh) meshes++; if (o.isSprite) sprites++; });
  heavy.sort((a, b) => b.tris - a.tris);
  return { plain, withBloom, programs: R.info.programs.length, geometries: R.info.memory.geometries, textures: R.info.memory.textures, sceneMeshes: meshes, sceneSprites: sprites, instancedMeshes: inst, lights: w.plights.length, pixelRatio: R.getPixelRatio(), categories: cats, heaviest: heavy.slice(0, 6) };
}

const SCENES = [
  ['Thorngate spawn (day)', { x: 0, z: 60, used: 0 }],
  ['Thorngate gate road (night)', { x: 0, z: 46, used: 2 }],
  ['Your plot (night, market open)', { x: 14, z: 44, used: 2, market: true }],
  ['Erelian (day)', { x: -44, z: 4, used: 0 }],
  ['Cindral Wastes (day)', { x: 56, z: -8, used: 0 }],
  ['Runekar\'s Deep', { x: 46, z: -44, used: 0 }],
  ['The Veilmoor (night)', { x: 0, z: 80, used: 2 }],
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = { label: LABEL, date: new Date().toISOString(), three: null, file: { bytes: Buffer.byteLength(GAME), lines: GAME.split('\n').length }, viewports: {} };
  for (const [vp, viewport] of [['phone', { width: 412, height: 860, isMobile: true, hasTouch: true }], ['desktop', { width: 1280, height: 720 }]]) {
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
    await page.setRequestInterception(true); page.on('request', serve);
    await page.setViewport(viewport);
    const t0 = Date.now(); await page.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(page);
    await page.waitForFunction(() => typeof W3 !== 'undefined' && W3 && W3.renderer, { timeout: 60000 });
    const ready = Date.now() - t0;
    out.three = await page.evaluate(() => THREE.REVISION);
    await page.evaluate(() => document.querySelector('[data-act="begin"]').click()); await wait(800);
    const res = { worldReadyMsSoftware: ready, scenes: {} };
    for (const [name, s] of SCENES) {
      await page.evaluate((s) => { ui.dialog = null; ui.banner = null; S.used = s.used; S.pos = { x: s.x, z: s.z }; window.__teleport = true; W3.grace = 1e9; W3.cam.yaw = 0; W3.cam.pitch = 0.38; if (s.market && !ui.market) { doAction('sp', 'market'); for (let i = 0; i < 200; i++) updateCustomers(0.05, i * 0.05); } render(); }, s);
      // Wait until the game loop has moved the camera to the new spot (a fixed wait sometimes
      // measured the previous scene in software rendering), then let lights settle.
      await page.waitForFunction((s) => { const c = W3.camera.position; return Math.hypot(c.x - s.x, c.z - s.z) < 15 && !window.__teleport; }, { timeout: 30000, polling: 100 }, s);
      await wait(2500); await page.evaluate(() => { W3.lightT = 0; }); await wait(600);
      const at = await page.evaluate(() => [W3.camera.position.x, W3.camera.position.z]);
      if (Math.hypot(at[0] - s.x, at[1] - s.z) > 15) throw new Error(`${name}: camera not at the scene`);
      res.scenes[name] = await page.evaluate(measure);
    }
    res.heapMB = await page.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null));
    res.errors = errors;
    out.viewports[vp] = res;
    await page.close();
  }
  await browser.close();
  const dir = path.join(ROOT, 'production', 'qa', 'baseline'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `perf-${LABEL}.json`), JSON.stringify(out, null, 2));
  console.log(`three r${out.three} · file ${out.file.bytes} bytes, ${out.file.lines} lines`);
  for (const [vp, r] of Object.entries(out.viewports)) {
    console.log(`\n${vp} (world ready ${r.worldReadyMsSoftware} ms in software rendering, heap ${r.heapMB} MB${r.errors.length ? ', ERRORS: ' + r.errors.join('; ') : ''})`);
    for (const [name, m] of Object.entries(r.scenes)) {
      const cats = Object.entries(m.categories).sort((a, b) => b[1].calls - a[1].calls).map(([k, v]) => `${k} ${v.calls}`).join(', ');
      console.log(`  ${name}: ${m.plain.calls} calls (${m.withBloom.calls} with bloom), ${m.plain.tris} tris | ${cats}`);
    }
  }
})();
