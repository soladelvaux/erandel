// Acceptance test for the living world (docs/systems/living-world.md), headless Chrome.
// The simulation is stepped with explicit frame times (deterministic; software rendering is about 1 fps).
//  1 clock     hours run in game time, wait at the end of the part of the day, and a deed moves them on;
//              the light follows the hour (dawn, day, dusk, night differ)
//  2 schedule  Elash follows his day: tends the hero tree in the morning, walks the bridge at dusk,
//              sleeps by the spires at night; simulation levels switch with distance (full / simple / distant)
//  3 dialogue  lines follow his activity, react to hunting in his groves, and remember past meetings
//  4 weather   rain fades in (particles), the wind rises, the fog changes; clear fades it out
//  5 creatures a day creature rests at night and hunts by day; a night creature the reverse; a badly hurt
//              beast flees; a patrolling creature walks its loop
//  6 events    the soul-lights at the Thorngate at night; a discovery in Erelian
//  7 persist   after a reload: clock, weather, discoveries, events, NPC memory and help given are restored,
//              and Elash stands where his schedule says
// Evidence: production/qa/evidence/living-world/.
// Usage: CHROME=/path/to/chrome node integration/living-world.js   (exit code 1 on failure)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { serveThree, serveAssets } = require('../helpers/serve-three');
const { waitForStart } = require('../helpers/wait-start');

const ROOT = path.join(__dirname, '..', '..');
const GAME = require('../../tools/build').assembleGame();
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const OUT = path.join(ROOT, 'production', 'qa', 'evidence', 'living-world');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const check = (ok, what) => { if (!ok) failures.push(what); console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('keep')) localStorage.clear(); } catch (e) { /* ignore */ } });
  await page.setRequestInterception(true);
  page.on('request', (r) => { const u = r.url(); if (u.split('?')[0] === 'https://erandel.test/') return r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>' + GAME + '</body></html>' }); if (serveAssets(r) || serveThree(r)) return; return r.abort(); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(page);
  await page.evaluate(() => { ui.cname = 'Wren'; ui.pick = 'humans'; document.querySelector('[data-act="begin"]').click(); });
  await page.waitForFunction(() => W3.player.ch && S && S.world && REGION.status !== 'loading' && REGION.status !== 'waiting', { timeout: 120000 });
  const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png') });
  const goTo = async (x, z, yaw) => { await page.evaluate((x, z, yaw) => { ui.dialog = null; ui.banner = null; S.pos = { x, z }; window.__teleport = true; W3.grace = 1e9; W3.cam.yaw = yaw || 0; render(); }, x, z, yaw); await page.waitForFunction((x, z) => Math.hypot(W3.player.x - x, W3.player.z - z) < 1.5, { timeout: 30000, polling: 100 }, x, z); };
  const elash = () => page.evaluate(() => { const n = W3.npcs.find((o) => o.id === 'bramble'); return { x: +n.x.toFixed(2), z: +n.z.toFixed(2), act: n.act, lvl: n.lvl, visible: n.ch.g.visible }; });
  // step the NPC simulation for `sec` seconds of 0.05 s frames at a fixed hour
  const simNpcs = (hour, sec) => page.evaluate((hour, sec) => { S.world.hour = hour; for (let i = 0; i < sec * 20; i++) livingNpcs(0.05, i * 0.05); }, hour, sec);

  // 1 clock
  const clk = await page.evaluate(() => { const r = {}; S.used = 0; LW.slot = -1; S.world.hour = 11.5; clockTick(0); clockTick(45 * 0.25); r.after15m = +S.world.hour.toFixed(3); clockTick(45 * 3); r.waits = +S.world.hour.toFixed(3); S.used = 1; clockTick(0.05); r.afterDeed = +S.world.hour.toFixed(2);
    const L = (h) => { S.world.hour = h; const o = worldLight(1); return { night: +o.night.toFixed(2), sun: '#' + o.sun.getHexString() }; }; r.light = { 7: L(7), 13: L(13), 18: L(18), 21: L(21) }; S.used = 0; LW.slot = -1; S.world.hour = 6; clockTick(0); return r; });
  check(Math.abs(clk.after15m - 11.75) < 0.01, `1 the clock runs: 11:30 + 11.25 s of game time = ${clk.after15m} h (45 s per hour)`);
  check(clk.waits > 11.9 && clk.waits < 12, `1 the clock waits at the end of the morning for your deeds: ${clk.waits} h`);
  check(clk.afterDeed === 12, `1 a deed moves the day on: afternoon starts at ${clk.afterDeed} h`);
  check(clk.light[7].night < 0.2 && clk.light[13].night === 0 && clk.light[18].night > 0.2 && clk.light[18].night < 0.8 && clk.light[21].night === 1 && clk.light[13].sun !== clk.light[18].sun, `1 the light follows the hour: night factor 07:00 ${clk.light[7].night}, 13:00 ${clk.light[13].night}, dusk 18:00 ${clk.light[18].night}, 21:00 ${clk.light[21].night}`);

  // 2 Elash's day, at full detail (the player stands near)
  await goTo(-45, 8, Math.PI / 2);
  await simNpcs(8, 30); const morning = await elash();
  check(morning.act === 'tend' && Math.hypot(morning.x + 47.2, morning.z - 14.2) < 0.5 && morning.lvl === 'full', `2 08:00 Elash tends the hero tree: ${JSON.stringify(morning)}`);
  await page.evaluate(() => { W3.cam.yaw = 2.4; W3.zoom = 0.7; }); await wait(2500); await shot('01-elash-morning');
  await simNpcs(18.5, 30); const dusk = await elash();
  const onRoute = await page.evaluate(() => { const n = W3.npcs.find((o) => o.id === 'bramble'); const r = SCHEDULES.bramble[3][3]; return polyDist(n.x, n.z, r) < 0.6; });
  check(dusk.act === 'walk' && onRoute, `2 18:30 Elash walks his evening route over the bridge: ${JSON.stringify(dusk)}, on the route ${onRoute}`);
  await simNpcs(22, 30); const night = await elash();
  check(night.act === 'sleep' && Math.hypot(night.x + 51.5, night.z - 6.5) < 0.6, `2 22:00 Elash sleeps by the spires: ${JSON.stringify(night)}`);
  await goTo(50, -10); await simNpcs(8, 2); const far = await elash();
  check(far.lvl === 'distant' && !far.visible && Math.hypot(far.x + 47.2, far.z - 14.2) < 0.5, `2 far away Elash is simulated lightly (hidden, schedule only): ${JSON.stringify(far)}`);
  await goTo(-2, 14); await simNpcs(8, 2); const mid = await elash();
  check(mid.lvl === 'simple' && mid.visible, `2 at middle distance Elash is simplified: ${JSON.stringify(mid)}`);

  // 3 dialogue, reactions and memory
  await goTo(-45.5, 13.5, Math.PI / 2); await simNpcs(8, 4);
  const talk1 = await page.evaluate(() => { const n = W3.npcs.find((o) => o.id === 'bramble'); openTalk(n); const r = { say: ui.dialog.say, talks: S.npcs.bramble.talks }; return r; });
  await wait(1500); await shot('02-elash-talk'); await page.evaluate(() => { ui.dialog = null; render(); });
  check(/new to the white boughs/.test(talk1.say) && talk1.talks === 1, `3 first meeting: "${talk1.say}" (talks ${talk1.talks})`);
  const talk2 = await page.evaluate(() => { openTalk(W3.npcs.find((o) => o.id === 'bramble')); const r = ui.dialog.say; ui.dialog = null; return r; });
  check(/older than the spires/.test(talk2), `3 the line follows his activity (tending): "${talk2}"`);
  const talk3 = await page.evaluate(() => { W3.monsters.filter((m) => m.alive && m.region === 'greenmere').slice(0, 2).forEach((m) => killMonster(m)); openTalk(W3.npcs.find((o) => o.id === 'bramble')); const r = ui.dialog.say; ui.dialog = null; return r; });
  check(/fell to you today/.test(talk3), `3 he reacts to hunting in his groves: "${talk3}"`);
  const help = await page.evaluate(() => { S.used = 0; OUT = []; doAction('help', 'bramble'); return { helped: S.npcs.bramble.helped, day: S.day }; });
  check(help.helped === help.day, `3 helping Elash is recorded (day ${help.helped})`);

  // 4 weather
  const wx = await page.evaluate(() => { const fogL = () => { const c = W3.scene.fog.color; return +(0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b).toFixed(3); }; const r = {};
    S.weather = 'clear'; for (let i = 0; i < 300; i++) weatherTick(0.1, 'clear'); r.clear = { rain: +LW.rain.toFixed(2), wind: +PAINT_WIND.value.toFixed(2), particles: W3.points.visible };
    S.weather = 'rain'; for (let i = 0; i < 20; i++) weatherTick(0.1, 'rain'); r.rain2s = +LW.rain.toFixed(2); for (let i = 0; i < 280; i++) weatherTick(0.1, 'rain'); r.rain = { rain: +LW.rain.toFixed(2), wind: +PAINT_WIND.value.toFixed(2), particles: W3.points.visible }; return r; });
  check(wx.clear.rain < 0.02 && !wx.clear.particles && wx.rain2s > 0.2 && wx.rain2s < 0.9 && wx.rain.rain > 0.98 && wx.rain.particles, `4 rain fades in (2 s: ${wx.rain2s}, 30 s: ${wx.rain.rain}) and the particles show`);
  check(wx.rain.wind > wx.clear.wind + 0.3, `4 the wind rises with rain: ${wx.clear.wind} -> ${wx.rain.wind}`);
  // the game loop eases the fog each frame: wait until it settles (about 1 fps here)
  const fogLum = () => page.evaluate(() => { const c = W3.scene.fog.color; return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; });
  // at least 30 s, then stable across 6 s (with no frame drawn between two samples, a short check would stop early)
  const settled = async () => { await wait(30000); let a = await fogLum(); for (let i = 0; i < 20; i++) { await wait(6000); const b = await fogLum(); if (Math.abs(b - a) < 0.002) return b; a = b; } return a; };
  await goTo(-44, 2, 0); await page.evaluate(() => { S.used = 0; LW.slot = 0; LW.day = S.day; S.world.hour = 9; W3.zoom = 1; }); // slot set too, so the clock does not restart the morning at dawn
  const fogRain = await settled(); await shot('03-rain');
  await page.evaluate(() => { S.weather = 'clear'; });
  const fogClear = await settled(); await shot('04-clear');
  check(fogRain < fogClear - 0.03, `4 rain darkens the air: fog luminance rain ${fogRain.toFixed(3)} vs clear ${fogClear.toFixed(3)}`);

  // 5 creatures
  const cr = await page.evaluate(() => { const r = {}; const t = W3.clock.elapsedTime; const step = (m, n) => { for (let i = 0; i < n; i++) updateMonster(m, 0.05, t + i * 0.05, false); };
    W3.grace = 0; const p = W3.player;
    const get = (n) => { const m = W3.monsters.find((o) => o.b.n === n); if (!m.alive) reviveMonster(m); return m; };
    const boar = get('Thornback Boar'), wisp = get('Will-o’-Wisp');
    const near = (m) => { m.st = 'wander'; m.hit = false; m.x = m.hx; m.z = m.hz; p.x = m.x + 5; p.z = m.z; };
    S.world.hour = 22; near(boar); step(boar, 10); r.boarNight = boar.st; near(wisp); step(wisp, 10); r.wispNight = wisp.st;
    S.world.hour = 10; near(boar); step(boar, 10); r.boarDay = boar.st; near(wisp); step(wisp, 10); r.wispDay = wisp.st;
    near(boar); boar.st = 'chase'; boar.hp = Math.max(1, Math.floor(boar.hpMax * 0.1)); const d0 = Math.hypot(boar.x - p.x, boar.z - p.z); step(boar, 20); r.flee = { st: boar.st, d0: +d0.toFixed(1), d1: +Math.hypot(boar.x - p.x, boar.z - p.z).toFixed(1) }; boar.hp = boar.hpMax;
    const gang = get('Cutpurse Gang'); S.world.hour = 22; p.x = gang.hx + 40; p.z = gang.hz; gang.st = 'wander'; gang.x = gang.hx; gang.z = gang.hz; gang.tx = gang.hx; gang.tz = gang.hz; step(gang, 400);
    r.patrol = +Math.hypot(gang.tx - gang.hx, gang.tz - gang.hz).toFixed(2); W3.grace = 1e9; return r; });
  check(cr.boarNight === 'rest' && cr.boarDay === 'chase', `5 Thornback Boar (a day creature) rests at night (${cr.boarNight}) and hunts by day (${cr.boarDay})`);
  check(cr.wispDay === 'rest' && ['chase', 'windup'].includes(cr.wispNight), `5 Will-o'-Wisp (a night creature) rests by day (${cr.wispDay}) and hunts at night (${cr.wispNight})`);
  check(cr.flee.st === 'flee' && cr.flee.d1 > cr.flee.d0, `5 a badly hurt boar flees: ${JSON.stringify(cr.flee)}`);
  check(Math.abs(cr.patrol - 6) < 0.01, `5 the Cutpurse Gang patrols a 6 m loop around its home: target ${cr.patrol} m out`);
  await page.evaluate(() => { const boar = W3.monsters.find((m) => m.b.n === 'Thornback Boar'); if (!boar.alive) reviveMonster(boar); S.used = 2; S.world.hour = 22; boar.st = 'rest'; S.pos = { x: boar.hx + 4, z: boar.hz + 3 }; window.__teleport = true; W3.zoom = 0.7; W3.cam.yaw = 0.6; });
  await wait(9000); await shot('05-boar-resting-at-night');

  // 6 events and a discovery
  await goTo(0, 58, 0); const ev = await page.evaluate(() => { S.used = 2; S.world.hour = 21; LW.evT = 0; eventsTick(0.05, 1); return { rec: S.world.events['souls-thorngate'], fx: (LW.fx['souls-thorngate'] || []).length }; });
  check(ev.rec && ev.rec.count === 1 && ev.fx === 8, `6 at night the soul-lights pass through the Thorngate: recorded ${JSON.stringify(ev.rec)}, ${ev.fx} lights`);
  await wait(9000); await shot('06-souls-thorngate');
  await goTo(-67.5, 19.4, 0); const disc = await page.evaluate(() => { LW.discT = 0; eventsTick(0.05, 1); return S.world.disc['erelian-springs']; });
  check(disc === (await page.evaluate(() => S.day)), `6 discovering the springs above Erelian's falls is recorded (day ${disc})`);
  await wait(1500); await shot('07-discovery');

  // 7 persistence: save, reload, compare
  await goTo(-45.5, 13.5, Math.PI / 2);
  const before = await page.evaluate(() => { S.used = 0; S.world.hour = 9.25; S.weather = 'rain'; save(); return JSON.parse(JSON.stringify({ day: S.day, hour: S.world.hour, weather: S.weather, disc: S.world.disc, events: S.world.events, elash: S.npcs.bramble, kills: S.world.kills })); });
  await page.evaluate(() => sessionStorage.setItem('keep', '1'));
  await page.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(page);
  await page.waitForFunction(() => S && S.world && W3 && W3.player.ch, { timeout: 120000 });
  const after = await page.evaluate(() => JSON.parse(JSON.stringify({ screen: ui.screen, day: S.day, hour: S.world.hour, weather: S.weather, disc: S.world.disc, events: S.world.events, elash: S.npcs.bramble, kills: S.world.kills })));
  check(after.screen === 'game' && after.day === before.day && Math.abs(after.hour - before.hour) < 0.5 && after.weather === 'rain', `7 reload restores the day, the hour and the weather: day ${after.day}, ${after.hour.toFixed(2)} h (saved ${before.hour}), ${after.weather}`);
  check(JSON.stringify(after.disc) === JSON.stringify(before.disc) && JSON.stringify(after.events) === JSON.stringify(before.events), `7 discoveries and world events survive the reload: ${Object.keys(after.disc).join(', ')}; ${Object.keys(after.events).join(', ')}`);
  check(JSON.stringify(after.elash) === JSON.stringify(before.elash) && after.elash.talks >= 3 && after.elash.helped === before.day, `7 Elash's memory of you and the help you gave survive: talks ${after.elash.talks}, helped day ${after.elash.helped}`);
  await page.evaluate(() => { for (let i = 0; i < 120; i++) livingNpcs(0.05, i * 0.05); }); const back = await elash();
  check(back.act === 'tend' && Math.hypot(back.x + 47.2, back.z - 14.2) < 0.6, `7 after the reload Elash is where his schedule says at ${after.hour.toFixed(2)} h: ${JSON.stringify(back)}`);
  const talkAgain = await page.evaluate(() => { openTalk(W3.npcs.find((o) => o.id === 'bramble')); const r = ui.dialog.say; ui.dialog = null; return r; });
  check(!/new to the white boughs/.test(talkAgain), `7 he does not greet you as a stranger after the reload: "${talkAgain}"`);

  check(!errors.length, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
  await browser.close();
  if (failures.length) { console.error('\nFAIL\n' + failures.join('\n')); process.exit(1); }
  console.log('\nPASS - the clock, schedules, dialogue, weather, creature habits, events and persistence all work');
})();
