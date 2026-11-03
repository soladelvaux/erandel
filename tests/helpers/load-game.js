// Loads src/index.html in jsdom (no WebGL, so the game runs in its 2D fallback mode)
// with a seeded Math.random so every run is deterministic.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const GAME = path.join(__dirname, '..', '..', 'src', 'index.html');

/** Small seeded RNG (mulberry32). */
function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Start a fresh game page.
 * @param {object} opts
 * @param {number} [opts.seed=1] RNG seed
 * @param {string} [opts.kind] if given, begins a new character of this kind
 * @returns {{window: Window, document: Document, run: (code: string) => any, errors: string[]}}
 */
function loadGame({ seed = 1, kind } = {}) {
  const html = fs.readFileSync(GAME, 'utf8');
  const errors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://erandel.test/',
    beforeParse(window) {
      window.Math.random = seeded(seed);
      window.scrollTo = () => {};
      window.addEventListener('error', (e) => errors.push(e.message));
      try { window.localStorage.clear(); } catch (e) { /* ignore */ }
    },
  });
  const { window } = dom;
  const document = window.document;
  const run = (code) => window.eval(code);
  if (kind) {
    document.querySelector(`[data-act="pick"][data-arg="${kind}"]`).click();
    document.querySelector('[data-act="begin"]').click();
  }
  return { window, document, run, errors };
}

module.exports = { loadGame, seeded, GAME };
