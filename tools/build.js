#!/usr/bin/env node
// Erandel build: one source, two outputs (docs/architecture/deployment.md).
//   dist/site/index.html     production page for https://soladelvaux.github.io/erandel/
//   dist/preview/erandel.html development preview for the claude.ai page (a body fragment)
// The game source is src/index.html. Once the code is split into modules (ADR-0002 U2),
// this script assembles them; the outputs and their paths stay the same.
// Usage: node tools/build.js   (prints sizes and the source commit)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.html');
const DIST = path.join(ROOT, 'dist');

/** Returns the game as one HTML body fragment (head tags, styles, layers, scripts). */
function assembleGame() {
  return fs.readFileSync(SRC, 'utf8');
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
  let commit = 'unknown';
  try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { /* not a git checkout */ }
  const stamp = `<!-- Erandel build from ${commit} -->\n`;
  fs.mkdirSync(path.join(DIST, 'site'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'preview'), { recursive: true });
  const site = SITE_HEAD + game + '\n' + stamp + '</body>\n</html>\n';
  fs.writeFileSync(path.join(DIST, 'site', 'index.html'), site);
  fs.writeFileSync(path.join(DIST, 'preview', 'erandel.html'), game);
  return { commit, siteBytes: Buffer.byteLength(site), previewBytes: Buffer.byteLength(game) };
}

if (require.main === module) {
  const r = build();
  console.log(`built from ${r.commit}: dist/site/index.html ${r.siteBytes} bytes, dist/preview/erandel.html ${r.previewBytes} bytes`);
}
module.exports = { build, assembleGame };
