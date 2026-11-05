// Serves Three.js to the browser tests from node_modules, matching the version the page asks for:
// 0.128.0 -> package three-r128, 0.147.0 -> three-r147, anything else -> three (r151).
// Handles the classic builds (three.min.js, examples/js) and the ES-module builds
// (build/three.module.js, examples/jsm) that r148+ pages load through an import map.
// Module scripts are fetched in CORS mode, so answers carry Access-Control-Allow-Origin.
// THREE_DELAY_MS=<ms> delays every answer, to test start-up on a slow network.
// Returns true if it answered the request.
const fs = require('fs');
const path = require('path');

const MODS = path.join(__dirname, '..', 'node_modules');
const pkgFor = (url) => (/three@0\.128\.0|three\.js\/r128\//.test(url) ? 'three-r128' : /three@0\.147\.0|three\.js\/0\.147\.0\//.test(url) ? 'three-r147' : 'three');
const DELAY = +process.env.THREE_DELAY_MS || 0;
const js = (req, file) => (DELAY ? setTimeout(() => respond(req, file), DELAY) : respond(req, file));
const respond = (req, file) => req.respond({ status: 200, contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(file, 'utf8') });

/** @param {import('puppeteer-core').HTTPRequest} req */
function serveThree(req) {
  const u = req.url().split('?')[0];
  const pkg = pkgFor(u);
  if (/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/.+\/three(\.min)?\.js$/.test(u)) return js(req, path.join(MODS, pkg, 'build', 'three.min.js')), true;
  const w = u.match(/three@[\d.]+\/(examples\/jsm\/libs\/.+\.wasm)$/);
  if (w) return req.respond({ status: 200, contentType: 'application/wasm', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(path.join(MODS, pkg, w[1])) }), true;
  const m = u.match(/three@[\d.]+\/((?:build|examples\/jsm?)\/.+\.js)$/);
  // jsDelivr minifies on request (three.module.min.js); the package has only three.module.js.
  // THREE_MIN_FILE=<path> serves a real copy of the CDN file instead, to check it works.
  if (m && /three\.module\.min\.js$/.test(m[1])) return js(req, process.env.THREE_MIN_FILE || path.join(MODS, pkg, 'build', 'three.module.js')), true;
  if (m) return js(req, path.join(MODS, pkg, m[1])), true;
  return false;
}

const ROOT = path.join(__dirname, '..', '..');
/** Serves the game's own assets (assets/game/...) from the repo for pages at https://erandel.test/. */
function serveAssets(req) {
  const u = req.url().split('?')[0];
  const m = u.match(/^https:\/\/erandel\.test\/(assets\/game\/[\w\/.-]+)$/);
  if (!m) return false;
  const f = path.join(ROOT, m[1]);
  if (!f.startsWith(path.join(ROOT, 'assets', 'game')) || !fs.existsSync(f)) return req.respond({ status: 404, body: '' }), true;
  const type = f.endsWith('.png') ? 'image/png' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream';
  return req.respond({ status: 200, contentType: type, body: fs.readFileSync(f) }), true;
}

module.exports = { serveThree, serveAssets };
