// Accounts smoke test (design/gdd/accounts.md). Runs the real game in headless Chrome against a
// stand-in for Supabase: the client library is replaced by a small module that forwards every
// call to an in-memory server here in Node (auth users, sessions, the profiles and saves tables,
// row-level ownership, a case-insensitive unique name index). Each "device" is a separate
// browser context, so storage is not shared. Screenshots go to production/qa/evidence/.
//
// Usage: CHROME=/path/to/chrome node integration/accounts-smoke.js   (exit code 1 on failure)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..', '..');
const GAME = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
const MODS = path.join(__dirname, '..', 'node_modules');
const OUT = path.join(ROOT, 'production', 'qa', 'evidence');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- in-memory stand-in for the Supabase project ---------- */
const server = { users: {}, byEmail: {}, tokens: {}, profiles: {}, saves: {} };
const err = (message, code) => ({ error: { message, code } });
const session = (u) => { const t = crypto.randomUUID(); server.tokens[t] = u.id; return { access_token: t, user: pub(u) }; };
const pub = (u) => ({ id: u.id, email: u.email || '', is_anonymous: !u.email });
function handle({ op, a, token }) {
  const uid = server.tokens[token];
  if (op === 'anon') { const u = { id: crypto.randomUUID() }; server.users[u.id] = u; return { session: session(u) }; }
  if (op === 'signup') {
    if (server.byEmail[a.email]) return err('User already registered');
    const u = { id: crypto.randomUUID(), email: a.email, password: a.password }; server.users[u.id] = u; server.byEmail[a.email] = u.id; return { session: session(u) };
  }
  if (op === 'signin') { const u = server.users[server.byEmail[a.email]]; if (!u || u.password !== a.password) return err('Invalid login credentials'); return { session: session(u) }; }
  if (op === 'update') {
    const u = server.users[uid]; if (!u) return err('Auth session missing!');
    if (a.email && server.byEmail[a.email] && server.byEmail[a.email] !== uid) return err('A user with this email address has already been registered');
    if (a.email) { u.email = a.email; server.byEmail[a.email] = uid; } if (a.password) u.password = a.password; return { user: pub(u) };
  }
  if (op === 'db') {
    if (!uid) return err('permission denied', '42501');
    const own = (row) => (a.table === 'profiles' ? row.id : row.user_id) === uid;
    const key = a.table === 'profiles' ? 'id' : 'user_id';
    const T = server[a.table]; if (!T) return err('relation does not exist', '42P01');
    if (a.op === 'select') {
      let rows = Object.values(T).filter((r) => a.filters.every(([c, v]) => r[c] === v));
      if (a.table === 'saves') rows = rows.filter(own); // RLS: own save only
      return { data: a.single ? rows[0] || null : rows };
    }
    if (a.op === 'upsert') {
      if (!own(a.row)) return err('new row violates row-level security policy', '42501');
      if (a.table === 'profiles' && Object.values(T).some((r) => r.id !== a.row.id && r.name.toLowerCase() === a.row.name.toLowerCase())) return err('duplicate key value violates unique constraint "profiles_name_lower"', '23505');
      T[a.row[key]] = { ...(T[a.row[key]] || {}), ...a.row }; return { data: null };
    }
    if (a.op === 'delete') { Object.values(T).filter((r) => own(r) && a.filters.every(([c, v]) => r[c] === v)).forEach((r) => delete T[r[key]]); return { data: null }; }
  }
  return err('unsupported ' + op);
}

/* ---------- stand-in for @supabase/supabase-js, forwarding to the server above ---------- */
const FAKE_SUPABASE = `
export function createClient(url, key, opts) {
  const LS = (opts && opts.auth && opts.auth.storageKey) || 'sb-auth';
  let session = null; try { session = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {}
  const setS = (s) => { session = s; try { s ? localStorage.setItem(LS, JSON.stringify(s)) : localStorage.removeItem(LS); } catch (e) {} };
  const call = (op, a) => window.__fakeServer(JSON.stringify({ op, a, token: session && session.access_token })).then((r) => JSON.parse(r));
  const signed = (r) => { if (r.error) return { data: {}, error: r.error }; setS(r.session); return { data: { session: r.session, user: r.session.user }, error: null }; };
  const auth = {
    getSession: async () => ({ data: { session }, error: null }),
    signInAnonymously: async () => signed(await call('anon', {})),
    signUp: async ({ email, password }) => signed(await call('signup', { email, password })),
    signInWithPassword: async ({ email, password }) => signed(await call('signin', { email, password })),
    updateUser: async (attrs) => { const r = await call('update', attrs); if (r.error) return { data: {}, error: r.error }; session.user = r.user; setS(session); return { data: { user: r.user }, error: null }; },
    signOut: async () => { setS(null); return { error: null }; },
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  };
  const from = (table) => {
    const q = { table, op: 'select', cols: '*', filters: [], row: null, single: false };
    const b = {
      select(c) { q.cols = c || '*'; return b; }, eq(c, v) { q.filters.push([c, v]); return b; }, maybeSingle() { q.single = true; return b; },
      upsert(r) { q.op = 'upsert'; q.row = r; return b; }, delete() { q.op = 'delete'; return b; },
      then(res, rej) { return call('db', q).then((r) => ({ data: r.data === undefined ? null : r.data, error: r.error || null })).then(res, rej); },
    };
    return b;
  };
  return { auth, from };
}`;

function serve(req) {
  const u = req.url();
  if (u === 'https://erandel.test/fake-supabase.js') return req.respond({ status: 200, contentType: 'application/javascript', body: FAKE_SUPABASE });
  if (u.startsWith('https://erandel.test/')) return req.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>' + GAME + '</body></html>' });
  if (u.includes('three.min.js')) return req.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(MODS, 'three/build/three.min.js'), 'utf8') });
  const m = u.match(/three@0\.128\.0\/(examples\/js\/.+\.js)$/);
  if (m) return req.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(MODS, 'three', m[1]), 'utf8') });
  return req.abort();
}

async function device(browser, failures, label) {
  const ctx = browser.createBrowserContext ? await browser.createBrowserContext() : await browser.createIncognitoBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => failures.push(`${label}: ${e.message}`));
  if (process.env.DEBUG) { page.on('request', (r) => console.log(label, 'req', r.url().slice(0, 90))); page.on('console', (m) => console.log(label, m.type(), m.text().slice(0, 150))); }
  await page.exposeFunction('__fakeServer', (s) => JSON.stringify(handle(JSON.parse(s))));
  await page.evaluateOnNewDocument(() => { window.__SUPA_CFG = { url: 'https://fake.supabase.test', key: 'anon-key', lib: 'https://erandel.test/fake-supabase.js', pushEvery: 500, connectTimeout: 40000 }; });
  await page.setRequestInterception(true);
  page.on('request', serve);
  await page.setViewport({ width: 412, height: 860, isMobile: true, hasTouch: true });
  await page.goto('https://erandel.test/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof ACC !== 'undefined' && (ui.screen === 'login' && ACC.status === 'ready' || ui.screen === 'game'), { timeout: 45000 }).catch(async (e) => { console.error(label, 'stuck', await page.evaluate(() => JSON.stringify({ screen: typeof ui !== 'undefined' && ui.screen, st: typeof ACC !== 'undefined' && ACC.status, has3d: typeof HAS3D !== 'undefined' && HAS3D }))); throw e; });
  return { page, ctx };
}
const type = (page, sel, v) => page.evaluate((s, val) => { const el = document.querySelector(s); el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }, sel, v);
const click = (page, act) => page.evaluate((a) => document.querySelector(`[data-act="${a}"]`).click(), act);
const state = (page) => page.evaluate(() => ({ screen: ui.screen, name: S && S.name, gold: S && S.gold, guest: isGuest(), email: ACC.user && ACC.user.email, msg: ACC.msg, toast: ui.toast, owner: S && S.owner, uid: ACC.user && ACC.user.id }));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const failures = [];
  const check = (ok, msg) => { if (!ok) failures.push(msg); };

  // Device 1: guest
  const d1 = await device(browser, failures, 'guest');
  await d1.page.screenshot({ path: path.join(OUT, 'phone-00-login.png') });
  await click(d1.page, 'acc-guest');
  await d1.page.waitForFunction(() => ui.screen === 'create', { timeout: 8000 });
  await type(d1.page, '#cname', 'Mira');
  await click(d1.page, 'begin');
  await d1.page.waitForFunction(() => ui.screen === 'game', { timeout: 8000 });
  let s1 = await state(d1.page);
  check(s1.guest && s1.name === 'Mira' && s1.owner === s1.uid, `guest did not start as Mira ${JSON.stringify(s1)}`);
  check(Object.values(server.profiles).some((p) => p.name === 'Mira'), 'name Mira not claimed on the server');
  await d1.page.evaluate(() => { S.gold = 777; save(); });
  await wait(1500);
  check(server.saves[s1.uid] && server.saves[s1.uid].data.gold === 777, 'guest save was not pushed to the cloud');

  // Device 2: email account; the name Mira (any case) is taken
  const d2 = await device(browser, failures, 'email');
  await type(d2.page, '#acc-email', 'kael@example.com'); await type(d2.page, '#acc-pass', 'short');
  await click(d2.page, 'acc-signup'); await wait(200);
  check(/8 characters/.test((await state(d2.page)).msg), 'short password not refused');
  await type(d2.page, '#acc-pass', 'moonwell-42');
  await click(d2.page, 'acc-signup');
  await d2.page.waitForFunction(() => ui.screen === 'create', { timeout: 8000 });
  await type(d2.page, '#cname', 'mIRa'); await click(d2.page, 'begin'); await wait(600);
  let s2 = await state(d2.page);
  check(s2.screen === 'create' && /already taken/.test(s2.toast), `duplicate name was not refused ${JSON.stringify(s2)}`);
  await type(d2.page, '#cname', 'Kael'); await click(d2.page, 'begin');
  await d2.page.waitForFunction(() => ui.screen === 'game', { timeout: 8000 });
  s2 = await state(d2.page);
  check(!s2.guest && s2.email === 'kael@example.com' && s2.name === 'Kael', `email player wrong ${JSON.stringify(s2)}`);

  // Device 1: the guest links an email and keeps the hero
  await d1.page.evaluate(() => { ui.dialog = null; render(); });
  await click(d1.page, 'settings'); await click(d1.page, 'acc-link-open');
  await type(d1.page, '#acc-email', 'kael@example.com'); await type(d1.page, '#acc-pass', 'tidesong-77'); await click(d1.page, 'acc-link'); await wait(400);
  check(/already/.test((await state(d1.page)).msg), 'linking an email that belongs to someone else was not refused');
  await type(d1.page, '#acc-email', 'mira@example.com'); await type(d1.page, '#acc-pass', 'tidesong-77');
  await d1.page.screenshot({ path: path.join(OUT, 'phone-00-link-email.png') });
  await click(d1.page, 'acc-link'); await wait(600);
  s1 = await state(d1.page);
  check(!s1.guest && s1.email === 'mira@example.com' && s1.name === 'Mira' && s1.gold === 777, `linking lost the hero ${JSON.stringify(s1)}`);

  await d1.ctx.close(); await d2.ctx.close(); // free the software renderer for the next device
  // Device 3: a new phone; wrong password, then sign in and get the same hero from the cloud
  const d3 = await device(browser, failures, 'new-device');
  await type(d3.page, '#acc-email', 'mira@example.com'); await type(d3.page, '#acc-pass', 'wrong-password'); await click(d3.page, 'acc-signin'); await wait(300);
  check(/Wrong email or password/.test((await state(d3.page)).msg), 'wrong password message missing');
  await type(d3.page, '#acc-pass', 'tidesong-77'); await click(d3.page, 'acc-signin');
  await d3.page.waitForFunction(() => ui.screen === 'game', { timeout: 8000 });
  let s3 = await state(d3.page);
  check(s3.name === 'Mira' && s3.gold === 777, `cloud save not restored on a new device ${JSON.stringify(s3)}`);
  // reload: the session is remembered
  await d3.page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await d3.page.waitForFunction(() => typeof ACC !== 'undefined' && (ui.screen === 'game' || (ui.screen === 'login' && ACC.status === 'ready')), { timeout: 45000 });
  s3 = await state(d3.page);
  check(s3.screen === 'game' && s3.name === 'Mira', `session not remembered after reload ${JSON.stringify(s3)}`);
  // sign out returns to the login screen and clears this device's copy
  await d3.page.evaluate(() => accSignOut()); await wait(400);
  s3 = await state(d3.page);
  const localLeft = await d3.page.evaluate(() => localStorage.getItem(SAVE_KEY));
  check(s3.screen === 'login' && !s3.name && !localLeft, `sign out incomplete ${JSON.stringify(s3)}`);

  await browser.close();
  if (failures.length) { console.error('FAIL\n' + failures.join('\n')); process.exit(1); }
  console.log('PASS - guest, email sign-up, unique names, linking, cloud restore, reload and sign-out');
})();
