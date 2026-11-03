// Seeded random playthrough: every kind plays 25 days pressing every kind of button
// in the 2D fallback. Fails on page errors, non-finite numbers in the save,
// or "undefined"/"NaN" shown to the player.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, seeded } = require('../helpers/load-game');

const DAYS = 25;
const KINDS = loadGame().run('Object.keys(RACES)');

function badNumbers(obj, path = 'S', out = []) {
  for (const k in obj) {
    const v = obj[k];
    if (typeof v === 'number' && !Number.isFinite(v)) out.push(`${path}.${k}`);
    else if (v && typeof v === 'object') badNumbers(v, `${path}.${k}`, out);
  }
  return out;
}

for (const [i, kind] of KINDS.entries()) {
  test(`playthrough: ${kind} survives ${DAYS} days`, () => {
    const g = loadGame({ seed: 100 + i, kind });
    const rnd = seeded(7 + i);
    const pickOpt = (id) => {
      const s = g.document.getElementById(id);
      if (!s || !s.options.length) return;
      s.selectedIndex = Math.floor(rnd() * s.options.length);
      s.dispatchEvent(new g.window.Event('change', { bubbles: true }));
    };
    const click = (sel) => { const b = g.document.querySelector(sel); if (b && !b.disabled) b.click(); };
    const tab = (t) => click(`[data-act="tab"][data-arg="${t}"]`);
    for (let day = 0; day < DAYS; day++) {
      for (let k = 0; k < 12; k++) {
        tab('act');
        const r = rnd();
        if (r < 0.12) { pickOpt('travel'); click('[data-act="travel"]'); }
        else if (r < 0.25) click('[data-act="practice"]');
        else if (r < 0.32) { pickOpt('food'); click('[data-act="eat"]'); }
        else if (r < 0.36) click('[data-act="job"]');
        else if (r < 0.42) { if (!g.document.querySelector('[data-act="invite"]:not(:disabled)')) click('[data-act="decline"]'); else click('[data-act="invite"]'); }
        else if (r < 0.52) {
          tab('magic');
          ['fs', 'fe1', 'fe2', 'ff'].forEach(pickOpt);
          click('[data-act="forge"]');
          if (rnd() < 0.1) click('[data-act="forget"]');
        } else {
          const buttons = [...g.document.querySelectorAll('button.act:not(:disabled)')];
          if (buttons.length) buttons[Math.floor(rnd() * buttons.length)].click();
        }
      }
      ['self', 'world', 'log', 'act'].forEach(tab);
      g.run('sleep()');
    }
    const save = g.run('S');
    assert.deepEqual(g.errors, [], 'page errors');
    assert.deepEqual(badNumbers(save), [], 'non-finite numbers in save');
    assert.ok(save.day >= DAYS + 1, 'days advanced');
    for (const t of ['act', 'self', 'magic', 'world', 'log']) {
      tab(t);
      assert.doesNotMatch(g.document.getElementById('app').textContent, /undefined|NaN|\[object/, `tab ${t}`);
    }
  });
}
