// Save compatibility: a save made by an older build must load and play in the current build.
// Usage: CHROME=... node integration/save-compat.js [old-build-file]
// Default old build: the v0.4.1 baseline from git (branch rollback/v0.4.1 or origin/rollback/v0.4.1).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-core');
const { serveThree } = require('../helpers/serve-three');
const { waitForStart } = require('../helpers/wait-start');

const ROOT = path.join(__dirname, '..', '..');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const NEW = require('../../tools/build').assembleGame();
const OLD = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : (() => {
  for (const ref of ['rollback/v0.4.1', 'origin/rollback/v0.4.1']) {
    try { return execSync(`git show ${ref}:src/index.html`, { cwd: ROOT, maxBuffer: 1 << 26 }).toString(); } catch (e) { /* try the next */ }
  }
  throw new Error('baseline build not found: fetch the rollback/v0.4.1 branch or pass a file');
})();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let current = OLD;
const page = (html) => '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>' + html + '</body></html>';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await browser.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.setRequestInterception(true);
  p.on('request', (r) => { if (r.url().startsWith('https://erandel.test/')) return r.respond({ status: 200, contentType: 'text/html', body: page(current) }); if (serveThree(r)) return; r.abort(); });
  await p.setViewport({ width: 800, height: 600 });
  // 1. play a little in the old build
  await p.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(p); await wait(1500);
  const made = await p.evaluate(() => {
    localStorage.clear(); ui.cname = 'Oldsave'; ui.pick = 'merfolk'; document.querySelector('[data-act="begin"]').click();
    doAction('train'); doAction('explore'); S.gold = 321; S.build.length; save();
    return { rev: typeof THREE !== 'undefined' ? THREE.REVISION : null, name: S.name, race: S.race, day: S.day, gold: S.gold, used: S.used, builds: S.build.length, stats: S.stats.str };
  });
  // 2. open the same storage in the new build
  current = NEW;
  await p.goto('https://erandel.test/', { waitUntil: 'load' }); await waitForStart(p); await wait(2500);
  const loaded = await p.evaluate(() => ({ rev: typeof THREE !== 'undefined' ? THREE.REVISION : null, screen: ui.screen, name: S && S.name, race: S && S.race, day: S && S.day, gold: S && S.gold, used: S && S.used, builds: S && S.build.length, stats: S && S.stats.str }));
  const after = await p.evaluate(() => { const g = S.gold; doAction('rest'); return { ok: S.used === 3 && S.gold === g }; });
  await browser.close();
  const same = ['name', 'race', 'day', 'gold', 'used', 'builds', 'stats'].every((k) => made[k] === loaded[k]);
  if (errors.length || loaded.screen !== 'game' || !same || !after.ok) {
    console.error('FAIL', JSON.stringify({ made, loaded, after, errors })); process.exit(1);
  }
  console.log(`PASS - a save from r${made.rev} loads and plays in r${loaded.rev} (${made.name}, ${made.race}, day ${made.day}, ${made.gold} gold)`);
})();
