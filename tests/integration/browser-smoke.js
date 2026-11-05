// Real-browser smoke test: loads src/index.html in headless Chrome with software WebGL,
// serves three.js + bloom from node_modules, walks through the main screens,
// plays real-time combat (melee, spells, enemy strikes, dodge), climbs a cliff,
// joins a fake multiplayer room (peers, chat, effects, a hostile name),
// simulates a full night market, and saves screenshots to production/qa/evidence/.
//
// Usage: CHROME=/path/to/chrome node integration/browser-smoke.js
// (defaults to /usr/bin/google-chrome). Exit code 1 on any page error.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { serveThree } = require('../helpers/serve-three');
const { waitForStart } = require('../helpers/wait-start');

const ROOT = path.join(__dirname, '..', '..');
const GAME = require('../../tools/build').assembleGame();
const MODS = path.join(__dirname, '..', 'node_modules');
const OUT = path.join(ROOT, 'production', 'qa', 'evidence');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function serve(req) {
  const u = req.url();
  if (u.startsWith('https://erandel.test/')) {
    return req.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}</style></head><body>' + GAME + '</body></html>' });
  }
  if (serveThree(req)) return;
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
    await page.evaluateOnNewDocument(() => {
      try { localStorage.clear(); } catch (e) { /* ignore */ }
      // A stand-in for the artifact room capability: three other players, one with a hostile name.
      const H = {}; let P = null;
      const peers = [
        { peer: 'peer1', by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false, updatedAt: 0, presence: { n: 'Mira', k: 'merfolk', t: 2, ti: 'Tide Singer', x: 2.5, y: 0, z: 57, r: 3, a: 'idle', h: 80, hm: 90, g: 'vael' } },
        { peer: 'peer2', by: null, isMe: false, sameTab: false, kind: 'viewer', guest: true, updatedAt: 0, presence: { n: 'Kael', k: 'werewolves', t: 1, ti: '', x: -2.5, y: 0, z: 56, r: 2.4, a: 'run', h: 70, hm: 80, g: 'vael' } },
        { peer: 'peer3', by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false, updatedAt: 0, presence: { n: '<img src=x onerror=window.__xss=1>', k: '__proto__', t: 99, x: 1, y: 0, z: 63, r: 'x', a: '<b>' } },
        { peer: 'me', by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false, updatedAt: 0, presence: {} },
      ];
      window.__room = { emits: [], presence: [], fire: (t, m) => H[t] && H[t](m), peers };
      const room = {
        presence: async (o) => { window.__room.presence.push(o); },
        emit: async (t, d) => { window.__room.emits.push([t, d]); },
        on: (t, h) => { H[t] = h; return () => {}; },
        onPeers: (h) => { P = h; setTimeout(() => h({ peers, joined: peers, left: [], updated: [] }), 30); return () => {}; },
        onConnection: (h) => { setTimeout(() => h(true), 10); return () => {}; },
        connected: () => true, peers: () => peers,
      };
      window.claude = { use: async (n) => (n === 'room' ? room : null) };
    });
    await page.setRequestInterception(true);
    page.on('request', serve);
    await page.setViewport(viewport);
    await page.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(page);
    await wait(2500);
    const shot = (n) => page.screenshot({ path: path.join(OUT, `${name}-${n}.png`) });
    if (!(await page.evaluate(() => HAS3D))) failures.push(`${name}: WebGL world did not start`);
    await shot('01-threshold');
    await page.evaluate(() => document.querySelector('[data-act="begin"]').click());
    await wait(1500); await shot('02-spawn-aelarion');
    // regression: a character created after the world loads must meet enemies at full health and start with full focus
    const fresh = await page.evaluate(() => ({ bad: W3.monsters.filter((m) => m.hpMax !== enemyStats(m.b).hp).length, mp: W3.player.mp, max: mpMax() }));
    if (fresh.bad || fresh.mp < fresh.max - 1) failures.push(`${name}: new game state wrong ${JSON.stringify(fresh)}`);
    // multiplayer: peers rendered, names escaped, chat both ways, effects drawn
    await page.evaluate(() => { ui.dialog = null; ui.banner = null; S.pos = { x: 0, z: 60 }; window.__teleport = true; W3.grace = 1e9; W3.cam.yaw = 0.5; render(); });
    await wait(1800);
    const mp = await page.evaluate(() => {
      window.__room.fire('chat', { peer: 'peer1', sameTab: false, kind: 'viewer', topic: 'chat', data: { t: 'Hello from the Mere!' } });
      window.__room.fire('fx', { peer: 'peer2', sameTab: false, kind: 'viewer', topic: 'fx', data: { s: 'wave', x: -2.5, y: 0, z: 56, e: 'fire' } });
      window.__room.fire('fx', { peer: 'peer1', sameTab: false, kind: 'viewer', topic: 'fx', data: { s: 'nonsense', x: 'a' } });
      openChat(true); document.getElementById('chatin').value = 'Hi everyone'; document.getElementById('chatbar').requestSubmit(); openChat(false);
      const tags = [...document.querySelectorAll('#tags .tag.peer')].map((e) => e.textContent);
      return { peers: NET.peers.size, chibis: [...NET.peers.values()].filter((o) => o.ch).length, races: [...NET.peers.values()].map((o) => o.d.race), tags, xss: !!window.__xss || !!document.querySelector('#tags img'),
        chat: NET.chat.map((c) => c.t), sentChat: window.__room.emits.filter((e) => e[0] === 'chat').length, presence: window.__room.presence.length, online: document.getElementById('b-net').textContent };
    });
    if (mp.peers !== 3 || mp.chibis !== 3) failures.push(`${name}: expected 3 rendered peers ${JSON.stringify(mp)}`);
    if (mp.xss) failures.push(`${name}: a peer name was rendered as HTML`);
    if (mp.races[2] !== 'humans') failures.push(`${name}: invalid peer race not replaced ${JSON.stringify(mp.races)}`);
    if (!mp.tags.some((t) => t.includes('Mira'))) failures.push(`${name}: no name plate for Mira ${JSON.stringify(mp.tags)}`);
    if (mp.chat.join('|') !== 'Hello from the Mere!|Hi everyone' || mp.sentChat !== 1) failures.push(`${name}: chat failed ${JSON.stringify(mp)}`);
    if (mp.presence < 1) failures.push(`${name}: presence never sent`);
    if (!/4 online/.test(mp.online)) failures.push(`${name}: online count wrong: ${mp.online}`);
    await wait(600); await shot('03-third-person-players');
    // combat: melee kill, spell bolt, enemy strike, dodge
    const fight = await page.evaluate(() => {
      const w = W3, p = w.player; const m = w.monsters.find((o) => o.region === 'vael' && o.alive);
      S.pos = { x: m.x, z: m.z + 2 }; window.__teleport = true; w.grace = 0; m.x = m.hx; m.z = m.hz;
      return { hx: m.hx, hz: m.hz, idx: w.monsters.indexOf(m) };
    });
    await wait(700);
    const combat = await page.evaluate((idx) => {
      const w = W3, p = w.player, m = w.monsters[idx]; const r = {};
      w.grace = 1e9; p.x = m.hx; p.z = m.hz + 2; p.y = groundY(p.x, p.z); p.ground = true; p.climb = false; m.x = p.x; m.z = p.z + 1.6; w.target = m;
      const hp0 = m.hp; p.cd.atk = 0; playerAttack(); r.melee = hp0 - m.hp;
      S.spells.push({ src: 'mana', e1: 'fire', e2: null, form: 'bolt', name: 'Test Lance' }); renderSkills();
      r.slot = document.querySelector('#btns .sk').textContent;
      const hp1 = m.hp; p.mp = mpMax(); castSkill(0); for (let i = 0; i < 40 && w.projs.length; i++) updateProjs(0.05); r.bolt = hp1 - m.hp;
      r.mpSpent = mpMax() - p.mp;
      // enemy winds up and strikes
      w.grace = 0; const php = S.hp; m.st = 'chase'; m.cd = 0; m.x = p.x; m.z = p.z + 1.5;
      for (let i = 0; i < 40; i++) updateMonster(m, 0.05, w.clock.elapsedTime + 100, false);
      r.hitTaken = php - S.hp;
      // dodge: i-frames block the next strike
      S.hp = hpMax(); p.cd.dodge = 0; p.iUntil = w.clock.elapsedTime + 100; const php2 = S.hp; m.st = 'chase'; m.cd = 0; m.x = p.x; m.z = p.z + 1.5;
      for (let i = 0; i < 40; i++) updateMonster(m, 0.05, w.clock.elapsedTime + 100, false);
      r.dodged = php2 - S.hp; p.iUntil = 0; w.grace = 1e9;
      // finish it: kill reward
      const g0 = S.gold, used0 = S.used; let n = 0; while (m.alive && n++ < 60) { p.cd.atk = 0; m.x = p.x; m.z = p.z + 1.5; playerAttack(); }
      r.killed = !m.alive; r.gold = S.gold - g0; r.actionsUsed = S.used - used0; r.log = S.log[S.log.length - 1].t;
      return r;
    }, fight.idx);
    if (!(combat.melee > 0)) failures.push(`${name}: melee did no damage ${JSON.stringify(combat)}`);
    if (!(combat.bolt > 0) || combat.mpSpent !== 10) failures.push(`${name}: bolt failed ${JSON.stringify(combat)}`);
    if (!/Fire/.test(combat.slot)) failures.push(`${name}: skill slot not labelled ${JSON.stringify(combat)}`);
    if (!(combat.hitTaken > 0)) failures.push(`${name}: enemy never hit ${JSON.stringify(combat)}`);
    if (combat.dodged !== 0) failures.push(`${name}: dodge did not protect ${JSON.stringify(combat)}`);
    if (!combat.killed || !(combat.gold > 0) || combat.actionsUsed !== 0 || !/defeated/.test(combat.log)) failures.push(`${name}: kill reward wrong ${JSON.stringify(combat)}`);
    // live fight screenshot: a second monster in Erelian with numbers on screen
    await page.evaluate(() => { const w = W3; const m = w.monsters.filter((o) => o.alive && o.mo.type !== 'wisp' && heightAt(o.hx, o.hz) > 0.6).sort((p, q) => q.b.hp - p.b.hp)[0]; window.__fm = m; S.pos = { x: m.hx, z: m.hz + 3 }; window.__teleport = true; w.cam.yaw = 0; render(); });
    await wait(1600);
    await page.evaluate(() => { const w = W3, p = w.player; const m = window.__fm; ui.banner = null; ui.toast = ''; m.x = p.x + 0.9; m.z = p.z - 2.4; w.target = m; p.cd.atk = 0; playerAttack(); m.st = 'windup'; m.wind = m.stT = 5; m.cd = 9; render(); });
    await wait(250); await shot('04-action-combat');
    // climbing a steep slope
    const climb = await page.evaluate(() => {
      const c = CRAGS[0]; const x = c[0] + c[4] - 0.6, z = c[1];
      S.pos = { x, z }; window.__teleport = true; W3.grace = 1e9; W3.cam.yaw = -Math.PI / 2 + Math.PI; W3.cam.pitch = 0.3; keys.add('w');
      return { found: true, foot: groundY(x, z), top: groundY(c[0], c[1]) };
    });
    let climbed = false;
    for (let i = 0; i < 80 && !climbed; i++) { await wait(150); climbed = await page.evaluate(() => W3.player.climb); }
    await wait(400); climb.height = await page.evaluate(() => W3.player.y);
    await page.evaluate(() => keys.clear());
    if (!climb.found || !climbed) failures.push(`${name}: climbing never engaged ${JSON.stringify(climb)}`);
    else { await wait(200); await shot('05-climbing'); }
    await page.evaluate(() => { ui.dialog = null; S.pos = { x: 14, z: 44 }; window.__teleport = true; W3.grace = 1e9; render(); });
    await wait(2000); await page.evaluate(() => { ui.banner = null; render(); }); await wait(300); await shot('06-plot-day');
    await page.evaluate(() => { S.used = 2; render(); }); await wait(3000); await shot('07-plot-night');
    const market = await page.evaluate(() => {
      S.used = 1; doAction('sp', 'market');
      for (let i = 0; i < 6000 && ui.market; i++) updateCustomers(0.05, i * 0.05);
      return { sold: S.salesToday, cap: S.salesCap, open: !!ui.market };
    });
    if (market.sold !== market.cap || market.open) failures.push(`${name}: market did not complete ${JSON.stringify(market)}`);
    await page.evaluate(() => { S.gold += 500; S.mat.wood += 40; S.mat.stone += 20; document.querySelector('[data-act="build-open"]').click(); buildPlace('torii', 1, 7, 0); buildPlace('teahouse', 4, 6, 0); W3.hover = { c: 12, r: 1 }; ui.build.sel = 'shoji'; render(); });
    await wait(1500); await shot('08-build-mode');
    await page.evaluate(() => { ui.build = null; S.pos = { x: -44, z: 4 }; window.__teleport = true; render(); });
    await wait(2500); await page.evaluate(() => { ui.banner = null; render(); }); await wait(200); await shot('09-erelian-night');
    await page.evaluate(() => { ui.journal = true; render(); }); await wait(300); await shot('10-journal');
    await page.close();
  }
  await browser.close();
  if (failures.length) { console.error('FAIL\n' + failures.join('\n')); process.exit(1); }
  console.log(`PASS - screenshots in ${path.relative(ROOT, OUT)}`);
})();
