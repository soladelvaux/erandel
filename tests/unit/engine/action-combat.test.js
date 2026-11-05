// Real-time action combat and multiplayer data rules (design/gdd/action-combat.md, design/gdd/multiplayer.md).
// These run in jsdom without WebGL, so they test the engine formulas, not the 3D layer.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('../../helpers/load-game');

const RAT = 'REG.vael.beasts[0]'; // Rat King: hp 30, atk 5, gold 8, no element

test('focus: MP pool is 50 + 2 x Mind (action-combat AC1)', () => {
  const g = loadGame({ kind: 'humans' });
  assert.equal(g.run('mpMax()'), 50 + 2 * g.run('S.stats.mnd'));
  g.run('S.stats.mnd=20');
  assert.equal(g.run('mpMax()'), 90);
});

test('melee: swing damage uses the hunt weapon formula and Shape/Enchant passives (action-combat AC2)', () => {
  const g = loadGame({ kind: 'humans' });
  const base = 4 + g.run('S.stats.str') * 0.5 + g.run('S.stats.agi') * 0.3;
  assert.equal(g.run('meleeBase()'), base);
  g.run("S.spells.push({src:'mana',e1:'fire',e2:null,form:'shape',name:'a'})");
  assert.ok(Math.abs(g.run('meleeBase()') - base * 1.3) < 1e-9);
  g.run("S.spells.push({src:'mana',e1:'fire',e2:null,form:'enchant',name:'b'})");
  assert.ok(Math.abs(g.run('meleeBase()') - base * 1.3 * 1.2) < 1e-9);
});

test('skills: only damage spells fill the four hotbar slots, in spellbook order (action-combat AC3)', () => {
  const g = loadGame({ kind: 'humans' });
  g.run(`['ward','bolt','weave','wave','summon','ritual'].forEach((f,i)=>S.spells.push({src:'mana',e1:'fire',e2:null,form:f,name:'s'+i}))`);
  assert.deepEqual(JSON.parse(g.run('JSON.stringify(skillSlots().map(s=>s.form))')), ['bolt', 'wave', 'summon', 'ritual']);
  g.run("S.spells.splice(1,1)");
  assert.deepEqual(JSON.parse(g.run('JSON.stringify(skillSlots().map(s=>s.form))')), ['wave', 'summon', 'ritual']);
});

test('skills: spell hit = spell power x element multiplier x form damage; costs and cooldowns are data (action-combat AC3)', () => {
  const g = loadGame({ kind: 'humans' });
  g.run("S.aff.fire=20;window.__sp={src:'mana',e1:'fire',e2:null,form:'bolt',name:'x'}");
  const expect = g.run("spellPower(__sp)*spellMult(__sp,'nature')*FORMS.bolt.dmg");
  assert.equal(g.run("skillDamage(__sp,'nature')"), expect);
  assert.deepEqual(JSON.parse(g.run('JSON.stringify([ACT.skill.bolt.mp,ACT.skill.wave.mp,ACT.skill.summon.mp,ACT.skill.ritual.mp])')), [10, 18, 25, 30]);
});

test('enemies: HP and attack scale with tier like hunts; Ward cuts strikes by 40% (action-combat AC4)', () => {
  const g = loadGame({ kind: 'humans' });
  assert.deepEqual(JSON.parse(g.run(`JSON.stringify(enemyStats(${RAT}))`)), { hp: 30, atk: 5 });
  g.run('S.tier=3');
  assert.deepEqual(JSON.parse(g.run(`JSON.stringify(enemyStats(${RAT}))`)), { hp: 60, atk: 10 });
  g.run('S.tier=1;S.stats.end=0');
  assert.equal(g.run(`enemyHitDamage(${RAT})`), 5);
  g.run("S.spells.push({src:'mana',e1:'fire',e2:null,form:'ward',name:'w'})");
  assert.equal(g.run(`enemyHitDamage(${RAT})`), 3);
  g.run('S.stats.end=100');
  assert.equal(g.run(`enemyHitDamage(${RAT})`), 1, 'never below 1');
});

test('kills: pay 40% of hunt gold and small stat gains, cost no action, and stop paying after the daily cap (action-combat AC5)', () => {
  const g = loadGame({ kind: 'humans' });
  const gold0 = g.run('S.gold'), used0 = g.run('S.used'), str0 = g.run('S.stats.str');
  const line = g.run(`killReward(${RAT},['fire'])`);
  assert.match(line, /Rat King defeated\. \+3 gold/);
  assert.equal(g.run('S.gold') - gold0, 3);
  assert.equal(g.run('S.used'), used0);
  assert.ok(g.run('S.stats.str') > str0);
  assert.equal(g.run('S.bloodDay'), g.run('S.day'), 'a kill counts as blood for blood drinkers');
  for (let i = 1; i < 8; i++) g.run(`killReward(${RAT},[])`);
  const capped = g.run('S.gold');
  assert.match(g.run(`killReward(${RAT},[])`), /given all they will today/);
  assert.equal(g.run('S.gold'), capped, 'the 9th kill of the day pays nothing');
  g.run('S.day++');
  assert.match(g.run(`killReward(${RAT},[])`), /\+3 gold/, 'the cap resets at dawn');
});

test('multiplayer: peer presence is sanitized before display (multiplayer AC2)', () => {
  const g = loadGame({ kind: 'humans' });
  assert.equal(g.run('sanitizePeer(null)'), null);
  assert.equal(g.run("sanitizePeer({n:'x'})"), null, 'no position, not drawn');
  const p = g.run("sanitizePeer({n:'  Mira\\u200b\\u202e the\\nBrave and Bold Forever  ',k:'merfolk',t:3,x:999,y:-500,z:-999,r:1.2,a:'run',h:40,hm:80,g:'coral'})");
  assert.equal(p.name, 'Mira the Brave and B');
  assert.equal(p.race, 'merfolk');
  assert.equal(p.x, 80);
  assert.equal(p.z, -80);
  assert.equal(p.y, -30);
  assert.equal(p.anim, 'run');
  assert.equal(p.region, 'coral');
  const bad = g.run("sanitizePeer({n:'',k:'__proto__',t:'9',x:1,z:2,a:'<b>',g:'toString'})");
  assert.equal(bad.name, 'Wanderer');
  assert.equal(bad.race, 'humans');
  assert.equal(bad.tier, 1);
  assert.equal(bad.anim, 'idle');
  assert.equal(bad.region, null);
});

test('multiplayer: shared effects are whitelisted and chat text is cleaned (multiplayer AC3, AC4)', () => {
  const g = loadGame({ kind: 'humans' });
  assert.equal(g.run("sanitizeFx({s:'explode',x:0,z:0})"), null);
  assert.equal(g.run("sanitizeFx({s:'bolt',x:'1',z:0})"), null);
  const f = g.run("sanitizeFx({s:'bolt',x:1,z:2,e:'fire'})");
  assert.equal(f.e, 'fire');
  assert.equal(f.tx, 1);
  assert.equal(g.run("sanitizeFx({s:'wave',x:1,z:2,e:'constructor'}).e"), null);
  assert.equal(g.run("cleanText('hi\\u0000\\u200dthere\\u2066 <b>',80)"), 'hi there <b>', 'control characters become spaces, invisible ones vanish');
  assert.equal(g.run("cleanText('x'.repeat(200),80).length"), 80);
});

test('multiplayer: my presence is small and uses identifier keys (multiplayer AC1)', () => {
  const g = loadGame({ kind: 'humans' });
  const pr = g.run("myPresence({x:1.234,y:0.5,z:-3.21,ry:1.5,anim:'run'})");
  assert.ok(JSON.stringify(pr).length < 600);
  for (const k of Object.keys(pr)) assert.match(k, /^[A-Za-z_][A-Za-z0-9_-]*$/);
  assert.equal(pr.x, 1.2);
  assert.equal(pr.k, 'humans');
  assert.equal(g.run("myPresence({x:0,y:0,z:0,ry:0,anim:'teleport'}).a"), 'idle');
});
