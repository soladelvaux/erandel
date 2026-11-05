// Regression test for QA finding C1 (production/qa/phase7-qa-report.md): a save with one damaged
// field used to load and then make every render throw, so the game broke on every visit.
// Each case below damages one field of a healthy save; the game must start, render the HUD and the
// journal, produce a sim snapshot and save again, with no page error, keeping the good fields.
const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const { assembleGame } = require('../../../tools/build');
const { loadGame } = require('../../helpers/load-game');

const HTML = assembleGame();
const BASE = (() => { const g = loadGame({ kind: 'elves' }); const s = JSON.parse(g.run('S.gold=77;save();JSON.stringify(S)')); g.window.close(); return s; })();

// field -> damaged value (each one crashed render, the journal or simState before the fix)
const DAMAGE = {
  spells: 'x', traits: 5, npcs: null, regRep: null, sources: null, log: [null, 5], tier: 99, job: 'zz',
  comp: 5, flags: null, stats: {}, aff: 'x', mat: { wood: 'a' }, build: [{ t: 'nope' }], day: 'x', fate: 'x',
  gold: 'lots', pos: { x: 'a' }, hp: null, path: 'zz', chron: 'x', cond: [1], weather: 'storm-of-doom', name: null,
};

function boot(save) {
  const errors = [];
  const dom = new JSDOM(HTML, { runScripts: 'dangerously', url: 'https://erandel.test/', virtualConsole: new (require('jsdom').VirtualConsole)(),
    beforeParse(w) { w.scrollTo = () => {}; w.HTMLCanvasElement.prototype.getContext = () => null; w.addEventListener('error', (e) => errors.push(e.message)); w.localStorage.setItem('erandel-save-v1', JSON.stringify(save)); } });
  return { w: dom.window, errors };
}
const settle = () => new Promise((r) => setTimeout(r, 200));

test('a save with one damaged field still loads and plays', async () => {
  for (const [field, bad] of Object.entries(DAMAGE)) {
    const save = JSON.parse(JSON.stringify(BASE)); save[field] = bad;
    const { w, errors } = boot(save);
    await settle();
    const out = w.eval(`(()=>{const o={loaded:!!S&&ui.screen==='game'};for(const [n,f] of [['render',()=>render()],['journal',()=>{ui.journal=true;render();ui.journal=false;render();}],['sim',()=>JSON.stringify(simState())],['save',()=>save()]]){try{f();o[n]='ok';}catch(e){o[n]=e.message;}}o.gold=S&&S.gold;o.name=S&&S.name;return o;})()`);
    assert.deepStrictEqual({ field, loaded: out.loaded, render: out.render, journal: out.journal, sim: out.sim, save: out.save, errors },
      { field, loaded: true, render: 'ok', journal: 'ok', sim: 'ok', save: 'ok', errors: [] });
    if (field !== 'gold') assert.strictEqual(out.gold, 77, `${field}: good gold value kept`);
    if (field !== 'name') assert.strictEqual(out.name, BASE.name, `${field}: good name kept`);
    w.close();
  }
});

test('repairSave leaves a healthy save untouched', () => {
  const g = loadGame({ kind: 'merfolk' });
  const r = g.run('(()=>{const s=JSON.parse(JSON.stringify(S));const before=JSON.stringify(s);const fixed=repairSave(s);return {fixed,same:JSON.stringify(s)===before};})()');
  assert.deepStrictEqual(r.fixed.length, 0, 'nothing repaired: ' + r.fixed);
  assert.ok(r.same);
  g.window.close();
});

test('damaged numbers are replaced, not kept as text', () => {
  const g = loadGame({ kind: 'elves' });
  const r = g.run('(()=>{const s=JSON.parse(JSON.stringify(S));s.gold="lots";s.mat.wood=-3;s.tier=99;const fixed=repairSave(s);return {gold:s.gold,wood:s.mat.wood,tier:s.tier,fixed};})()');
  assert.deepStrictEqual({ gold: r.gold, wood: r.wood, tier: r.tier }, { gold: 0, wood: 0, tier: 1 });
  assert.ok(r.fixed.includes('gold') && r.fixed.includes('mat.wood') && r.fixed.includes('tier'));
  g.window.close();
});
