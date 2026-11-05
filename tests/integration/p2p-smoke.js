// Peer-to-peer multiplayer smoke test (design/gdd/multiplayer.md, "outside claude.ai").
// Opens the game twice in headless Chrome with no claude.ai room, so both copies fall back to
// the peer-to-peer world. The Trystero library is replaced by a stand-in that links the two
// pages over a BroadcastChannel, so the test needs no network and checks only the game's adapter:
// both players see each other, chat crosses, and a player who leaves disappears.
//
// Usage: CHROME=/path/to/chrome node integration/p2p-smoke.js   (exit code 1 on failure)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { serveThree, serveAssets } = require('../helpers/serve-three');
const { waitForStart } = require('../helpers/wait-start');

const ROOT = path.join(__dirname, '..', '..');
const GAME = require('../../tools/build').assembleGame();
const MODS = path.join(__dirname, '..', 'node_modules');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Stand-in for trystero's joinRoom/makeAction API (v0.26), linking same-origin pages.
const FAKE_TRYSTERO = `
export const selfId = Math.random().toString(36).slice(2);
export function joinRoom(cfg, rid) {
  const bc = new BroadcastChannel('fake-trystero-' + cfg.appId + '-' + rid);
  const acts = {}, known = new Set();
  const room = {
    onPeerJoin: null, onPeerLeave: null,
    makeAction(n) { const a = { onMessage: null, send: async (d, o) => bc.postMessage({ n, d, from: selfId, to: (o && o.target) || null }) }; acts[n] = a; return a; },
  };
  bc.onmessage = (e) => {
    const m = e.data; if (m.from === selfId) return;
    if (m.hello) { if (!known.has(m.from)) { known.add(m.from); room.onPeerJoin && room.onPeerJoin(m.from); } if (m.hello === 1) bc.postMessage({ hello: 2, from: selfId }); return; }
    if (m.bye) { known.delete(m.from); room.onPeerLeave && room.onPeerLeave(m.from); return; }
    if (m.to && m.to !== selfId) return;
    const a = acts[m.n]; if (a && a.onMessage) a.onMessage(m.d, { peerId: m.from });
  };
  setTimeout(() => bc.postMessage({ hello: 1, from: selfId }), 50);
  window.__fakeBye = () => bc.postMessage({ bye: 1, from: selfId });
  return room;
}`;

function serve(req) {
  const u = req.url();
  if (u === 'https://erandel.test/fake-trystero.js') return req.respond({ status: 200, contentType: 'application/javascript', body: FAKE_TRYSTERO });
  if (u.startsWith('https://erandel.test/')) {
    return req.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + GAME + '</body></html>' });
  }
  if (serveAssets(req) || serveThree(req)) return;
  return req.abort();
}

async function openPlayer(browser, name, kind, x, failures) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => failures.push(`${name}: ${e.message}`));
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } window.__P2P_LIB = 'https://erandel.test/fake-trystero.js'; });
  await page.setRequestInterception(true);
  page.on('request', serve);
  await page.setViewport({ width: 800, height: 600 });
  await page.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(page);
  await wait(1500);
  await page.evaluate((n, k, px) => { ui.cname = n; ui.pick = k; document.querySelector('[data-act="begin"]').click(); }, name, kind, x);
  await wait(800);
  await page.evaluate((px) => { ui.dialog = null; S.pos = { x: px, z: 58 }; window.__teleport = true; W3.grace = 1e9; render(); }, x);
  return page;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const failures = [];
  const a = await openPlayer(browser, 'Aster', 'elves', -1.5, failures);
  const b = await openPlayer(browser, 'Brook', 'merfolk', 1.5, failures);
  const seen = async (page) => page.evaluate(() => ({ p2p: !!(NET.room && NET.room.p2p), peers: [...NET.peers.values()].map((o) => o.d && o.d.name + '/' + o.d.race), drawn: [...NET.peers.values()].filter((o) => o.ch).length, online: document.getElementById('b-net').textContent }));
  let sa, sb;
  for (let i = 0; i < 40; i++) { await wait(250); sa = await seen(a); sb = await seen(b); if (sa.drawn === 1 && sb.drawn === 1) break; }
  if (!sa.p2p || !sb.p2p) failures.push(`peer-to-peer world not used ${JSON.stringify({ sa, sb })}`);
  if (sa.peers.join() !== 'Brook/merfolk' || sb.peers.join() !== 'Aster/elves') failures.push(`players did not see each other ${JSON.stringify({ sa, sb })}`);
  if (!/2 online/.test(sa.online)) failures.push(`online count wrong: ${sa.online}`);
  await b.evaluate(() => sendChat('Meet me at the gate'));
  await a.evaluate(() => { const p = W3.player; p.cd.atk = 0; W3.grace = 1e9; playerAttack(); });
  let chat = [];
  for (let i = 0; i < 20 && !chat.length; i++) { await wait(200); chat = await a.evaluate(() => NET.chat.filter((c) => !c.me).map((c) => c.n + ': ' + c.t)); }
  if (chat.join() !== 'Brook: Meet me at the gate') failures.push(`chat did not cross: ${JSON.stringify(chat)}`);
  await a.screenshot({ path: path.join(ROOT, 'production', 'qa', 'evidence', 'p2p-two-players.png') });
  await b.evaluate(() => window.__fakeBye());
  let left = 1;
  for (let i = 0; i < 20 && left; i++) { await wait(200); left = await a.evaluate(() => NET.peers.size); }
  if (left !== 0) failures.push('a player who left was still shown');
  await browser.close();
  if (failures.length) { console.error('FAIL\n' + failures.join('\n')); process.exit(1); }
  console.log('PASS - two peer-to-peer players met, chatted and parted');
})();
