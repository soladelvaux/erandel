// Serves Three.js and its examples/js add-ons from node_modules to the browser tests, matching
// the version the page asks for: three@0.128.0 or cdnjs .../r128/... -> package three-r128,
// anything else -> package three. Returns true if it answered the request.
const fs = require('fs');
const path = require('path');

const MODS = path.join(__dirname, '..', 'node_modules');
const pkgFor = (url) => (/three@0\.128\.0|three\.js\/r128\//.test(url) ? 'three-r128' : 'three');

/** @param {import('puppeteer-core').HTTPRequest} req */
function serveThree(req) {
  const u = req.url();
  if (/three(\.min)?\.js(\?|$)/.test(u) && /cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js|three@[\d.]+\/build\//.test(u)) {
    return req.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(MODS, pkgFor(u), 'build', 'three.min.js'), 'utf8') }), true;
  }
  const m = u.match(/three@[\d.]+\/(examples\/js\/.+\.js)$/);
  if (m) return req.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(MODS, pkgFor(u), m[1]), 'utf8') }), true;
  return false;
}

module.exports = { serveThree };
