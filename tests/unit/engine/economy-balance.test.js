// Balance regression tests from design/balance/balance-check-economy-2026-11-03.md.
// Each test pins a target from night-market-and-economy.md / building.md.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('../../helpers/load-game');

// Market income for one action with the current plot, without running the 3D market.
const MARKET_GOLD = `(()=>{const sl=sellers();const cap=salesCap();let g=0;for(let i=0;i<cap;i++)g+=salePrice(sl[i%sl.length]);return g;})()`;
const fill = (items) => `S.build=[];${JSON.stringify(items)}.forEach(([t,n])=>{for(let i=0;i<n;i++)S.build.push({t,c:0,r:0,rot:0,id:t+i});});`;

test('economy: starter market earns at most 5x an apprentice work shift', () => {
  // Arrange
  const g = loadGame({ kind: 'humans' });
  g.run("S.job='blacksmith';S.jobXp=0;S.stats.str=10");
  const work = g.run('Math.round(8+jobRank().i*8+S.stats.str*.4)');
  // Act
  const market = g.run(MARKET_GOLD);
  // Assert
  assert.ok(market <= 5 * work, `market ${market} vs work ${work}`);
  assert.ok(market >= 2 * work, `market ${market} should still beat work ${work} clearly`);
});

test('economy: a late, rich plot earns at most 8x a master work shift', () => {
  const g = loadGame({ kind: 'humans' });
  g.run("S.job='blacksmith';S.jobXp=160;S.stats.str=30;S.stats.cha=30;S.regRep.vael=60");
  g.run(fill([['stall', 3], ['teahouse', 2], ['boardwalk', 20], ['lantern', 10], ['shoji', 6], ['floatlantern', 15], ['lily', 10], ['torii', 2], ['moonring', 3], ['wisteria', 4]]));
  const work = g.run('Math.round(8+jobRank().i*8+S.stats.str*.4)');
  const market = g.run(MARKET_GOLD);
  assert.ok(market <= 8 * work, `market ${market} vs work ${work}`);
});

test('economy: spamming one cheap decoration adds at most 5x its single ambience', () => {
  const g = loadGame({ kind: 'humans' });
  g.run(fill([['floatlantern', 40]]));
  const amb = g.run('ambience()');
  assert.ok(amb <= 5 * 4, `40 floating lanterns gave ambience ${amb}`);
});

test('economy: master work pays at least 3.5x apprentice work at the same growth', () => {
  const g = loadGame({ kind: 'humans' });
  g.run("S.region='vael';S.job='blacksmith';S.jobXp=0;S.stats.str=10;S.used=0");
  const g0 = g.run('S.gold'); g.run("doAction('work')"); const apprentice = g.run('S.gold') - g0;
  g.run("S.jobXp=160;S.stats.str=30;S.used=0");
  const g1 = g.run('S.gold'); g.run("doAction('work')"); const master = g.run('S.gold') - g1;
  assert.ok(master >= 3.5 * apprentice, `master ${master} vs apprentice ${apprentice}`);
});

test('economy: repeated decorations cost more, decks do not', () => {
  const g = loadGame({ kind: 'humans' });
  g.run('S.gold=10000;S.mat.wood=500;S.mat.stone=500');
  const before = g.run('S.gold'); g.run("buildPlace('bench',2,7,0)"); g.run("buildPlace('lantern',2,8,0)");
  const firstLantern = before - g.run('S.gold');
  const b2 = g.run('S.gold'); g.run("buildPlace('lantern',1,8,0)");
  const nextLantern = b2 - g.run('S.gold');
  assert.ok(nextLantern > 8, `the 5th lantern post should cost more than 8 gold (paid ${nextLantern}, first paid ${firstLantern})`);
  const w0 = g.run('S.mat.wood'); g.run("buildPlace('boardwalk',8,3,0)");
  assert.equal(w0 - g.run('S.mat.wood'), 2, 'boardwalk always costs 2 wood');
});
