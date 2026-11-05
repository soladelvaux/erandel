// Simulation state boundary (docs/architecture/multiplayer-architecture.md §3): the game state as plain data,
// separate from rendering, with an authority for every field.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('../../helpers/load-game');

const SECTIONS = ['player', 'world', 'npcs', 'creatures', 'inventory', 'quests', 'events'];

test('state_has_the_seven_sections_and_is_plain_json_without_a_renderer', () => {
  const g = loadGame({ kind: 'elves' });
  assert.equal(g.run('HAS3D'), false); // jsdom: no WebGL, no three.js
  const s = g.run('simState()');
  SECTIONS.forEach((k) => assert.ok(k in s, 'missing ' + k));
  assert.equal(g.run('simIsPlain(simState())'), null);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), JSON.parse(g.run('JSON.stringify(simState())')));
});

test('state_follows_play', () => {
  const g = loadGame({ kind: 'humans' });
  const before = g.run('simState()');
  g.run("doAction('explore')");
  const after = g.run('simState()');
  assert.equal(after.player.actionsUsed, before.player.actionsUsed + 1);
  assert.equal(after.inventory.gold, g.run('S.gold'));
  assert.equal(after.npcs.length, g.run('Object.keys(NPCS).length'));
});

test('every_state_field_has_an_authority_and_outcomes_are_server_owned', () => {
  const g = loadGame({ kind: 'humans' });
  const paths = JSON.parse(g.run(`JSON.stringify((function walk(o,p,out){Object.keys(o).forEach(k=>{const v=o[k],q=p?p+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v)&&p.split('.').length<1)walk(v,q,out);else out.push(q);});return out;})(simState().player,'player',[]))`));
  paths.forEach((p) => assert.ok(['server', 'predicted', 'client'].includes(g.run(`simAuthority(${JSON.stringify(p)})`)), p));
  ['inventory.gold', 'inventory.materials', 'player.stats', 'player.tier', 'player.hp', 'quests.discoveries', 'creatures.hp', 'events.world'].forEach((p) => assert.equal(g.run(`simAuthority(${JSON.stringify(p)})`), 'server', p));
  assert.equal(g.run("simAuthority('player.pos')"), 'predicted');
  assert.equal(g.run("simAuthority('player.anim')"), 'client');
});

test('plain_check_rejects_functions_and_class_instances', () => {
  const g = loadGame({ kind: 'humans' });
  assert.match(g.run('simIsPlain({a:{b:()=>1}})'), /state\.a\.b is a function/);
  assert.match(g.run('simIsPlain({m:new Map()})'), /state\.m is a Map/);
  assert.match(g.run('simIsPlain({n:NaN})'), /not a finite number/);
});
