#!/usr/bin/env node
// Erandel build: one source, two outputs (docs/architecture/deployment.md).
//   dist/site/index.html     production page for https://soladelvaux.github.io/erandel/
//   dist/preview/erandel.html development preview for the claude.ai page (a body fragment)
// The game source is the module files under src/ (ADR-0002 U2), joined in the order given by
// src/manifest.json. The joined page is also written to src/index.html, the single page the
// tests, the preview and "open it in a browser" use. Never edit src/index.html by hand: edit
// the module file, then run this script (tests/unit/build/assembly.test.js fails if they differ).
// Usage: node tools/build.js           build dist/ and regenerate src/index.html
//        node tools/build.js --check   only check that src/index.html matches the modules
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const SRC = path.join(SRC_DIR, 'index.html');
const MANIFEST = path.join(SRC_DIR, 'manifest.json');
const DIST = path.join(ROOT, 'dist');

/** Lists the module files in join order, and fails if a module file under src/ is missing from
 *  the manifest or listed twice, so no part of the game can be silently left out. */
function listParts() {
  const parts = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).parts;
  const seen = new Set();
  for (const p of parts) {
    if (seen.has(p)) throw new Error(`src/manifest.json lists ${p} twice`);
    seen.add(p);
  }
  const onDisk = [];
  (function walk(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
      else if (/\.(html|css|js)$/.test(e.name) && r !== 'index.html') onDisk.push(r);
    }
  })(SRC_DIR, '');
  const missing = onDisk.filter((f) => !seen.has(f));
  if (missing.length) throw new Error('module files not in src/manifest.json: ' + missing.join(', '));
  return parts;
}

/** Returns the game as one HTML body fragment (head tags, styles, layers, scripts),
 *  joined from the module files. The JS modules share one classic <script> scope. */
function assembleGame() {
  return listParts().map((p) => fs.readFileSync(path.join(SRC_DIR, p), 'utf8')).join('');
}

const SITE_HEAD = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Erandel: an open-world fantasy action RPG you play together in the browser. Choose one of 36 kinds, fight, climb, build and meet other players.">
<meta property="og:title" content="Erandel">
<meta property="og:description" content="Open-world fantasy action RPG in your browser. 36 kinds, live combat, climbing, building and multiplayer.">
<meta name="theme-color" content="#0e1222">
<style>[hidden]{display:none!important}html,body{margin:0;padding:0;background:#0e1222}</style>
</head>
<body>
`;

function build() {
  const game = assembleGame();
  fs.writeFileSync(SRC, game);
  let commit = 'unknown';
  try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { /* not a git checkout */ }
  const stamp = `<!-- Erandel build from ${commit} -->\n`;
  fs.mkdirSync(path.join(DIST, 'site'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'preview'), { recursive: true });
  const site = SITE_HEAD + game + '\n' + stamp + '</body>\n</html>\n';
  fs.writeFileSync(path.join(DIST, 'site', 'index.html'), site);
  fs.writeFileSync(path.join(DIST, 'preview', 'erandel.html'), game);
  // Region assets (docs/regions/erelian.md) ship next to the page: dist/site/assets/game/...
  const assets = path.join(ROOT, 'assets', 'game');
  if (fs.existsSync(assets)) { fs.rmSync(path.join(DIST, 'site', 'assets'), { recursive: true, force: true }); fs.cpSync(assets, path.join(DIST, 'site', 'assets', 'game'), { recursive: true }); }
  return { commit, siteBytes: Buffer.byteLength(site), previewBytes: Buffer.byteLength(game) };
}

if (require.main === module && process.argv.includes('--check')) {
  const same = fs.readFileSync(SRC, 'utf8') === assembleGame();
  console.log(same ? 'src/index.html matches the modules' : 'src/index.html differs from the modules: run node tools/build.js');
  process.exit(same ? 0 : 1);
} else if (require.main === module) {
  const r = build();
  console.log(`built from ${r.commit}: dist/site/index.html ${r.siteBytes} bytes, dist/preview/erandel.html ${r.previewBytes} bytes`);
}
module.exports = { build, assembleGame, listParts };
