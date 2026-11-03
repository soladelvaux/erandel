// Deterministic rule tests for Erandel's engine. Each test starts a fresh game.
// Acceptance criteria referenced are in design/gdd/*.md.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('../../helpers/load-game');

test('kinds: all 36 kinds are selectable and start with 5 + bonus stats (kinds-and-bodies AC1, AC2)', () => {
  const g = loadGame();
  const kinds = [...g.document.querySelectorAll('[data-act="pick"]')].map((b) => b.dataset.arg);
  assert.equal(kinds.length, 36);
  const m = loadGame({ kind: 'merfolk' });
  assert.equal(m.run('S.stats.agi'), 7);
  assert.equal(m.run('S.stats.str'), 5);
  assert.equal(m.run('hpMax()'), 60 + 2 * m.run('S.stats.end'));
});

test('actions: a new day has 3 actions; Endurance 25 gives 4 (stats-and-actions AC1, AC2)', () => {
  const g = loadGame({ kind: 'humans' });
  assert.equal(g.run('energyMax()'), 3);
  g.run('S.stats.end=25');
  assert.equal(g.run('energyMax()'), 4);
});

test('actions: out of energy blocks timed actions (stats-and-actions AC1)', () => {
  const g = loadGame({ kind: 'humans' });
  g.run("doAction('rest');doAction('rest');doAction('rest')");
  const day = g.run('S.day');
  g.run("doAction('train')");
  assert.equal(g.run('S.used'), 3);
  assert.match(g.run('ui.toast'), /too tired/);
  assert.equal(g.run('S.day'), day);
});

test('survival: a human underwater loses 8 HP per action until Water 30 (survival-and-diet AC1)', () => {
  const g = loadGame({ kind: 'humans' });
  g.run("S.region='coral';S.weather='clear'");
  assert.ok(g.run("envWarnings().some(x=>x.n===8)"));
  g.run('S.aff.water=30');
  assert.ok(!g.run("envWarnings().some(x=>/breathe/.test(x.t))"));
});

test('survival: wrong food makes you sick, right food feeds you (survival-and-diet AC2, AC3, AC4)', () => {
  const v = loadGame({ kind: 'vampires' });
  v.run("doAction('eat','stew')");
  assert.ok(v.run('!!S.cond.sick'));
  const golem = loadGame({ kind: 'golems' });
  golem.run("doAction('eat','filings')");
  assert.equal(golem.run('S.fedDay'), golem.run('S.day'));
  const lich = loadGame({ kind: 'liches' });
  lich.run("doAction('eat','stew')");
  assert.match(lich.run('ui.toast'), /needs no food/);
});

test('evolution: tier 2 at day 4 with stats >= 50 picks the highest-stat path (evolution AC1)', () => {
  const g = loadGame({ kind: 'merfolk' });
  g.run("S.day=4;S.stats.agi=30;OUT=[];tryEvolve();flush()");
  assert.equal(g.run('S.tier'), 2);
  assert.equal(g.run('title()'), 'Shore Walker');
});

test('evolution: tier 3 is refused without an element at 30 (evolution AC2)', () => {
  const g = loadGame({ kind: 'merfolk' });
  g.run("S.tier=2;S.path=1;S.day=12;STATS.forEach(k=>S.stats[k]=25);S.aff.water=20;OUT=[];tryEvolve();flush()");
  assert.equal(g.run('S.tier'), 2);
  g.run("S.aff.water=30;OUT=[];tryEvolve();flush()");
  assert.equal(g.run('S.tier'), 3);
});

test('evolution: seraphs fall at corruption 25 (kinds-and-bodies AC3)', () => {
  const g = loadGame({ kind: 'seraphs' });
  g.run('S.corr=25;sleep()');
  assert.equal(g.run('S.race'), 'fallen');
});

test('elements: a fourth element is refused when three are held (elements-and-affinity AC1)', () => {
  const g = loadGame({ kind: 'merfolk' });
  g.run("S.aff.fire=5;S.aff.ice=5;OUT=[];addAff('moon',4);flush()");
  assert.equal(g.run('S.aff.moon'), 0);
  assert.equal(g.run("elemMult('fire','nature')"), 1.5);
  assert.equal(g.run("elemMult('fire','water')"), 0.67);
});

test('people: help works once per day (people-and-reputation AC1)', () => {
  const g = loadGame({ kind: 'humans' });
  g.run("doAction('help','ysolde')");
  const rep = g.run('S.npcs.ysolde.rep');
  g.run("doAction('help','ysolde')");
  assert.equal(g.run('S.npcs.ysolde.rep'), rep);
  assert.match(g.run('ui.toast'), /already helped/);
});

test('companions: rivals refuse to travel together (companions AC1)', () => {
  const g = loadGame({ kind: 'vampires' });
  const c = g.run("compat('werewolves').s");
  assert.ok(c < 35);
  g.run("S.cand={name:'X',race:'werewolves',compat:compat('werewolves').s,why:[]};doAction('invite')");
  assert.equal(g.run('S.comp'), null);
});

test('building: placement rules and refunds (building AC1-AC5)', () => {
  const g = loadGame({ kind: 'humans' });
  assert.equal(g.run('S.build.length'), 30);
  assert.equal(g.run('ambience()'), 82);
  assert.equal(g.run("canPlace('lantern',11,2,0)"), 'Build a boardwalk over the water first.');
  assert.equal(g.run("canPlace('lily',0,8,0)"), 'This goes on open water.');
  assert.equal(g.run("canPlace('bamboo',11,5,0)"), 'This needs dry land.');
  assert.equal(g.run("canPlace('torii',12,8,0)"), 'That does not fit on your plot.');
  g.run('S.gold=100;S.mat.wood=20');
  g.run("buildPlace('lantern',2,7,0)");
  assert.equal(g.run('S.gold'), 92);
  g.run('buildRemove(2,7)');
  assert.equal(g.run('S.gold'), 96);
});

test('market: starter plot sells 14 and cannot reopen the same day (night-market-and-economy AC1, AC2)', () => {
  const g = loadGame({ kind: 'humans' });
  assert.equal(g.run('salesCap()'), 14);
  const gold = g.run('S.gold');
  g.run("doAction('sp','market')");
  assert.equal(g.run('S.salesToday'), 14);
  assert.ok(g.run('S.gold') > gold);
  assert.match(g.run('marketCheck()'), /already held the market/);
  g.run("S.region='greenmere'");
  assert.match(g.run('marketCheck()'), /held in Thorngate/);
});
