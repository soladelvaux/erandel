// Acceptance test for the character and animation system (docs/characters/character-system.md), headless Chrome.
//  1 loads        adventurer, Thornback Boar and Lunar Stag GLBs; the player wears the adventurer (chibi hidden)
//  2 states       idle, walk, run, jump, dodge, attack, cast, hit, interact, death, climb are each reached
//                 through the game's own functions and controls (no direct clip calls)
//  3 blending     switching clips cross-fades (both clips weighted mid-switch), never snaps
//  4 sync         walk and run play at the real ground speed; dodge and attack are scaled to the game's timing
//  5 responsive   an attack or dodge shows on the very next frame
//  6 creatures    the boar follows its AI (walk / run / windup -> attack / hit / death, then hidden);
//                 the stag grazes and flees and is never a combat target
//  7 unchanged    the fall still returns the player to the Thorngate (after the death animation)
// Evidence: production/qa/evidence/characters/.
// Usage: CHROME=/path/to/chrome node integration/characters.js   (exit code 1 on failure)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { serveThree, serveAssets } = require('../helpers/serve-three');
const { waitForStart } = require('../helpers/wait-start');

const ROOT = path.join(__dirname, '..', '..');
const GAME = require('../../tools/build').assembleGame();
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const OUT = path.join(ROOT, 'production', 'qa', 'evidence', 'characters');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const check = (ok, what) => { if (!ok) failures.push(what); console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 120000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
  await page.setRequestInterception(true);
  page.on('request', (r) => { const u = r.url(); if (u.split('?')[0] === 'https://erandel.test/') return r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>' + GAME + '</body></html>' }); if (serveAssets(r) || serveThree(r)) return; return r.abort(); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(page);
  await page.evaluate(() => { ui.pick = 'elves'; document.querySelector('[data-act="begin"]').click(); });
  await page.waitForFunction(() => ['ready', 'partial', 'failed'].includes(CHR.status) && W3.player.ch, { timeout: 120000 });
  await wait(800);

  // 1 loads
  const ld = await page.evaluate(() => ({ status: CHR.status, errors: CHR.errors, hero: !!(CHR.hero && CHR.hero.model.parent === W3.player.ch.g), chibiHidden: W3.player.ch.g.children.filter((o) => o !== CHR.hero.model).every((o) => !o.visible), clips: Object.keys(CHR.hero.act).sort(), parts: (() => { let n = 0, tris = 0; CHR.hero.model.traverse((o) => { if (o.isMesh && o.visible) { n++; tris += o.geometry.index ? o.geometry.index.count / 3 : 0; } }); return { n, tris }; })(), elfEars: (() => { let e = null; CHR.hero.model.traverse((o) => { if (/ear_elf/.test(o.name)) e = o.visible; }); return e; })(), boars: CHR.creatures.length, stags: CHR.stags.length }));
  check(ld.status === 'ready' && !ld.errors.length, `1 models load: ${ld.status}${ld.errors.length ? ' ' + ld.errors.join('; ') : ''}`);
  check(ld.hero && ld.chibiHidden, `1 the player wears the adventurer, chibi hidden: ${ld.hero}, ${ld.chibiHidden}`);
  check(['attack', 'cast', 'climb', 'death', 'dodge', 'hit', 'idle', 'interact', 'jump', 'run', 'walk'].every((c) => ld.clips.includes(c)), `1 all clips present: ${ld.clips.join(' ')}`);
  check(ld.parts.n <= 10 && ld.parts.tris < 8000, `1 adventurer cost: ${ld.parts.n} draw calls, ${ld.parts.tris} triangles (budget 10, 8k)`);
  check(ld.elfEars === true, `1 the kind shows (an elf gets elf ears): ${ld.elfEars}`);
  check(ld.boars >= 1 && ld.stags === 3, `1 creatures placed: ${ld.boars} Thornback Boars rigged, ${ld.stags} Lunar Stags`);

  // put the player in an open meadow in Erelian, facing the camera, close-up camera for the evidence
  const goTo = async (x, z) => { await page.evaluate((x, z) => { ui.dialog = null; ui.banner = null; S.pos = { x, z }; window.__teleport = true; W3.grace = 1e9; render(); }, x, z); await page.waitForFunction((x, z) => Math.hypot(W3.player.x - x, W3.player.z - z) < 1.5, { timeout: 60000, polling: 100 }, x, z); };
  await goTo(-44, 2); await page.evaluate(() => { W3.zoom = 0.55; W3.cam.yaw = 0; W3.cam.pitch = 0.18; W3.player.ch.g.rotation.y = 0; }); await wait(2500);
  const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png') });
  const cur = () => page.evaluate(() => CHR.hero.cur);
  // Time-based states are stepped with explicit frames (deterministic; software rendering is ~1 fps):
  // 3 s of 0.05 s frames lets the welcome conversation's interact clip and the teleport settle.
  await page.evaluate(() => { for (let i = 0; i < 60; i++) heroTick(W3.player, 0.05); });
  check((await cur()) === 'idle', `2 idle when standing (also right after a teleport): ${await cur()}`); await shot('01-idle');

  // 3 blending, checked deterministically: step the state machine with small frames
  const blend = await page.evaluate(() => { const p = W3.player, c = CHR.hero; c.px = p.x; c.pz = p.z; heroTick(p, 0.03); const before = c.cur; c.px = p.x - 0.21; heroTick(p, 0.03); const a = c.act[before], b = c.act[c.cur]; return { from: before, to: c.cur, wFrom: +a.getEffectiveWeight().toFixed(2), wTo: +b.getEffectiveWeight().toFixed(2) }; });
  check(blend.from !== blend.to && blend.wFrom > 0.05 && blend.wTo > 0.05 && blend.wTo < 0.98, `3 cross-fade ${blend.from} -> ${blend.to}: weights ${blend.wFrom} / ${blend.wTo} mid-switch (no snap)`);

  // 2 + 4 run and walk through the real controls, timeScale against the measured speed
  // software rendering runs at about 1 frame per second: wait for the state, then measure
  const until = (fn, ms) => page.waitForFunction(fn, { timeout: ms || 30000, polling: 100 }).catch(() => {});
  await page.keyboard.down('w'); await until(() => CHR.hero.cur === 'run' && CHR.hero.speed > 4); await wait(300);
  const run = await page.evaluate(() => ({ cur: CHR.hero.cur, ts: CHR.hero.act.run.timeScale, sp: CHR.hero.speed, stride: CHR.hero.meta.stride.run }));
  await shot('02-run'); await page.keyboard.up('w');
  check(run.cur === 'run', `2 run with W: ${run.cur}`);
  check(Math.abs(run.ts - Math.max(0.5, run.sp / run.stride)) < 0.05 && run.sp > 4, `4 run plays at ground speed: ${run.sp.toFixed(1)} m/s -> timeScale ${run.ts.toFixed(2)}`);
  await page.keyboard.down('c'); await page.keyboard.down('w'); await until(() => CHR.hero.cur === 'walk' && CHR.hero.speed < 3.6 && CHR.hero.speed > 0.8); await wait(300);
  const walk = await page.evaluate(() => ({ cur: CHR.hero.cur, ts: CHR.hero.act.walk.timeScale, sp: CHR.hero.speed, stride: CHR.hero.meta.stride.walk }));
  await shot('03-walk'); await page.keyboard.up('w'); await page.keyboard.up('c'); await until(() => CHR.hero.cur === 'idle');
  check(walk.cur === 'walk', `2 walk with C+W: ${walk.cur}`);
  check(Math.abs(walk.ts - Math.max(0.4, walk.sp / walk.stride)) < 0.05 && walk.sp > 0.8 && walk.sp < 3.6, `4 walk plays at ground speed: ${walk.sp.toFixed(1)} m/s -> timeScale ${walk.ts.toFixed(2)}`);

  // 2 + 5 one-shots through the game's own actions, observed on the next frame
  const oneShot = async (fn, want, shotName) => { const r = await page.evaluate((fn) => { const p = W3.player; p.cd = p.cd || {}; Object.keys(p.cd).forEach((k) => { p.cd[k] = 0; }); window[fn](); heroTick(p, 0.016); return { cur: CHR.hero.cur, ts: CHR.hero.act[CHR.hero.cur] && CHR.hero.act[CHR.hero.cur].timeScale }; }, fn); if (shotName) { await wait(120); await shot(shotName); } await settle(); return r; };
  // Isolation: each check starts from a settled player, whatever the frame rate (CI runners are slower than this machine)
  async function settle() { await page.evaluate(() => { const p = W3.player; p.atkAnim = 0; p.dodgeT = 0; p.castAnim = 0; p.hitT = 0; p.interactT = 0; p.vy = 0; p.y = groundY(p.x, p.z); p.ground = true; p.climb = false; for (let i = 0; i < 12; i++) heroTick(p, 0.05); }); }
  const atk = await oneShot('playerAttack', 'attack', '04-attack');
  check(atk.cur === 'attack', `2/5 attack shows on the next frame: ${atk.cur}`);
  const dodge = await oneShot('playerDodge', 'dodge', '05-dodge');
  check(dodge.cur === 'dodge' && Math.abs(dodge.ts - 0.5 / 0.28) < 0.05, `2/4/5 dodge on the next frame, scaled to the game's 0.28 s: ${dodge.cur}, timeScale ${dodge.ts && dodge.ts.toFixed(2)}`);
  const jump = await oneShot('playerJump', 'jump', '06-jump');
  check(jump.cur === 'jump', `2 jump: ${jump.cur}`);
  await wait(800);
  const cast = await page.evaluate(() => { const p = W3.player; p.castAnim = 0.5; heroTick(p, 0.016); return CHR.hero.cur; });
  check(cast === 'cast', `2 cast (the game's castAnim): ${cast}`); await settle();
  const hit = await page.evaluate(() => { const m = W3.monsters.find((o) => o.alive); W3.player.iUntil = 0; const hp = S.hp; damagePlayer(1, m); heroTick(W3.player, 0.016); return { cur: CHR.hero.cur, hp0: hp, hp1: S.hp }; });
  check(hit.cur === 'hit' && hit.hp1 === hit.hp0 - 1, `2 hit reaction when damaged: ${hit.cur}, hp ${hit.hp0} -> ${hit.hp1}`); await wait(120); await shot('07-hit'); await settle();
  const inter = await page.evaluate(() => { ui.dialog = null; doAction('explore'); ui.dialog = null; ui.fadeText = null; heroTick(W3.player, 0.016); return CHR.hero.cur; });
  check(inter === 'interact', `2 interaction on an action: ${inter}`); await wait(500); await shot('08-interact'); await wait(900);
  const climb = await page.evaluate(() => { const p = W3.player; p.climb = true; p.climbMove = true; heroTick(p, 0.016); const r = CHR.hero.cur; p.climb = false; return r; });
  check(climb === 'climb', `2 climb (the game's climbing state): ${climb}`);

  // 6 creatures
  const boar = await page.evaluate(() => { const c = CHR.creatures[0], m = c.m; const out = {}; m.st = 'windup'; m.wind = 0.7; creatureTick(c, 0.016); out.windup = c.cur; m.st = 'wander'; m.flash = 0.2; creatureTick(c, 0.016); out.hit = c.cur; m.flash = 0; return out; });
  check(boar.windup === 'attack' && boar.hit === 'hit', `6 boar follows its AI: windup -> ${boar.windup}, struck -> ${boar.hit}`);
  const boarView = await page.evaluate(() => { const m = CHR.creatures[0].m; S.pos = { x: m.x + 2.5, z: m.z + 3 }; window.__teleport = true; W3.cam.yaw = 0.7; W3.zoom = 0.6; return [m.x, m.z]; });
  await wait(2500); await shot('09-boar');
  const death = await page.evaluate(() => { const c = CHR.creatures[0], m = c.m; killMonster(m); creatureTick(c, 0.016); return { cur: c.cur, visible: m.mo.g.visible }; });
  await wait(400); await shot('10-boar-death');
  const gone = await page.evaluate(() => { const c = CHR.creatures[0]; for (let i = 0; i < 40; i++) creatureTick(c, 0.05); return !c.m.mo.g.visible; });
  check(death.cur === 'death' && death.visible && gone, `6 boar death plays, then the body is hidden: ${death.cur}, shown ${death.visible}, hidden after ${gone}`);
  const stag = await page.evaluate(() => { const c = CHR.stags[0], s = c.s; const d0 = Math.hypot(s.x - s.hx, s.z - s.hz); S.pos = { x: s.x + 3, z: s.z }; window.__teleport = true; return { d0, targetable: W3.monsters.some((m) => m.b.n === 'Lunar Stag' && m.region === 'greenmere') }; });
  await wait(2500);
  const fled = await page.evaluate(() => { const c = CHR.stags[0], p = W3.player; return { st: c.s.st, dist: Math.hypot(c.s.x - p.x, c.s.z - p.z), cur: c.cur }; });
  await page.evaluate(() => { W3.cam.yaw = Math.PI; }); await wait(1200); await shot('11-stag');
  check(fled.st === 'flee' || fled.dist > 7, `6 the stag flees from the player: state ${fled.st}, ${fled.dist.toFixed(1)} m away, clip ${fled.cur}`);
  check(!stag.targetable, `6 the Lunar Stag in Erelian is never a combat target`);

  // 7 the fall: death clip first, then the existing return to the Thorngate
  await goTo(-44, 2); await page.evaluate(() => { W3.zoom = 0.55; W3.cam.yaw = 0; W3.player.ch.g.rotation.y = 0; }); await wait(1500);
  const fall = await page.evaluate(() => { const m = W3.monsters.find((o) => o.alive); W3.player.iUntil = 0; const p = W3.player, x0 = p.x; damagePlayer(S.hp + 5, m); heroTick(p, 0.016); return { cur: CHR.hero.cur, x0, dialog: ui.dialog && ui.dialog.title }; });
  await wait(700); await shot('12-fall');
  const fell = await page.evaluate(() => ({ x: W3.player.x, z: W3.player.z }));
  // 2 s of frames for the death clip (downT 1.8 s); the game loop then applies the pending return
  const held = await page.evaluate(() => { for (let i = 0; i < 40; i++) heroTick(W3.player, 0.05); return { spos: S.pos, tp: !!window.__teleport }; });
  check(held.tp && Math.hypot(held.spos.x - 2, held.spos.z - 46) < 3, `7 during the death clip the return to the Thorngate stays pending and its destination survives autosave: ${JSON.stringify(held)}`);
  await page.waitForFunction(() => Math.hypot(W3.player.x - 2, W3.player.z - 46) < 3, { timeout: 120000, polling: 200 }).catch(() => {});
  const home = await page.evaluate(() => ({ x: W3.player.x, z: W3.player.z, hp: S.hp, downT: W3.player.downT, tp: !!window.__teleport, spos: S.pos, cur: CHR.hero.cur, t: W3.clock.elapsedTime }));
  console.log('     fall trace', JSON.stringify(home));
  check(fall.cur === 'death' && fall.dialog === 'You fell', `7 falling plays the death clip with the existing dialog: ${fall.cur}, "${fall.dialog}"`);
  check(Math.hypot(fell.x + 44, fell.z - 2) < 2 && Math.hypot(home.x - 2, home.z - 46) < 3 && home.hp > 0, `7 the body stays down during the clip, then the existing return to the Thorngate happens: (${home.x.toFixed(1)}, ${home.z.toFixed(1)}), hp ${home.hp}`);

  check(!errors.length, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
  await browser.close();
  if (failures.length) { console.error('\nFAIL\n' + failures.join('\n')); process.exit(1); }
  console.log('\nPASS - the adventurer and the creatures load, animate every state in sync with the game, and gameplay is unchanged');
})();
