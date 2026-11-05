// Client message validation (docs/architecture/multiplayer-architecture.md §5, §7): clients send intents,
// never outcomes. The protocol file must run on its own (a future Node server reuses it unchanged).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function protocol() {
  const ctx = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'src', 'net', 'protocol.js'), 'utf8') + ';this.api={validateIntent,acceptClientMessage,containsForbidden,NET_LIMITS};', ctx);
  return ctx.api;
}

test('protocol_runs_alone_without_game_or_browser', () => {
  const p = protocol();
  assert.equal(typeof p.validateIntent, 'function');
});

test('valid_intents_are_accepted', () => {
  const { acceptClientMessage: ok } = protocol();
  assert.equal(ok({ t: 'move', x: 1, z: 0.5, seq: 5 }, { x: 0, z: 0, dt: 0.2, seq: 4 }), null);
  assert.equal(ok({ t: 'attack', target: 'c3', seq: 6 }), null);
  assert.equal(ok({ t: 'chat', text: 'Meet me at the gate' }), null);
  assert.equal(ok({ t: 'cast', slot: 2, target: '', seq: 7 }), null);
});

test('outcomes_are_never_accepted_from_a_client', () => {
  const { acceptClientMessage: ok } = protocol();
  assert.match(ok({ t: 'action', kind: 'job', arg: '', seq: 1, gold: 999 }), /may not send gold/);
  assert.match(ok({ t: 'attack', target: 'c1', seq: 2, extra: { damage: 50 } }), /may not send damage/);
  assert.match(ok({ t: 'move', x: 0, z: 0, seq: 3, stats: { str: 99 } }), /may not send stats/);
});

test('cheating_and_malformed_moves_are_rejected', () => {
  const { acceptClientMessage: ok, NET_LIMITS } = protocol();
  const far = NET_LIMITS.runSpeed * NET_LIMITS.speedSlack * 0.1 + 1;
  assert.equal(ok({ t: 'move', x: far, z: 0, seq: 2 }, { x: 0, z: 0, dt: 0.1, seq: 1 }), 'moved too far');
  assert.equal(ok({ t: 'move', x: 0.1, z: 0, seq: 1 }, { x: 0, z: 0, dt: 0.1, seq: 1 }), 'stale or replayed');
  assert.equal(ok({ t: 'move', x: 'a', z: 0, seq: 2 }), 'x must be a number');
  assert.equal(ok({ t: 'move', x: Infinity, z: 0, seq: 2 }), 'x must be finite');
  assert.equal(ok({ t: 'teleport', x: 0, z: 0 }), 'unknown intent');
  assert.equal(ok({ t: 'cast', slot: 9, target: '', seq: 1 }), 'no such skill slot');
  assert.equal(ok({ t: 'dodge', dx: 5, dz: 0, seq: 1 }), 'dodge direction too long');
  assert.equal(ok({ t: 'chat', text: 'x'.repeat(121) }), 'too long');
  assert.equal(ok([]), 'not an object');
});
