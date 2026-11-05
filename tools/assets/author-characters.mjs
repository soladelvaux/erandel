// Authors Erandel's rigged characters (ERANDEL_ART_BIBLE.md §6, §7, §15; docs/characters/character-system.md).
// Deterministic, generated in code, exported as skinned, animated glTF:
//   assets/game/all/chr_all_adventurer.glb   player adventurer, 25 bones, 11 clips, painted face texture
//   assets/game/erelian/cre_erelian_thornback-boar.glb   hostile (registry B5), 6 clips
//   assets/game/erelian/cre_erelian_lunar-stag.glb       neutral wildlife in Erelian (registry B20; role PROVISIONAL), 6 clips
// v1 assets: each can be replaced by a hand-made or AI-assisted model with the same bone and clip names.
// Usage: npm run characters   (inside tools/assets)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, prune, dedup } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { PNG } from 'pngjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'assets', 'game');
// GLTFExporter needs a FileReader in Node.
globalThis.FileReader = class { readAsArrayBuffer(b) { b.arrayBuffer().then((r) => { this.result = r; this.onloadend && this.onloadend(); }); } readAsDataURL(b) { b.arrayBuffer().then((r) => { this.result = 'data:' + (b.type || 'application/octet-stream') + ';base64,' + Buffer.from(r).toString('base64'); this.onloadend && this.onloadend(); }); } };

/* ---------- helpers ---------- */
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const D = Math.PI / 180;
function hash(i) { let h = Math.imul(i, 374761393); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

/** Builds a skeleton from [name, parent, x, y, z] rows (absolute rest positions; no rest rotation). */
function skeleton(rows) {
  const bones = {}, abs = {}, list = [];
  for (const [n, p, x, y, z] of rows) { const b = new THREE.Bone(); b.name = n; abs[n] = new THREE.Vector3(x, y, z); if (p) { b.position.copy(abs[n]).sub(abs[p]); bones[p].add(b); } else b.position.set(x, y, z); bones[n] = b; list.push(b); }
  return { bones, abs, list, index: Object.fromEntries(list.map((b, i) => [b.name, i])) };
}
/** Skin weights: fn(x,y,z) -> [[boneName, weight], ...]; normalised, up to 4 influences. */
function skin(g, sk, fn) {
  const p = g.attributes.position, si = new Uint16Array(p.count * 4), sw = new Float32Array(p.count * 4);
  for (let i = 0; i < p.count; i++) { let w = fn(p.getX(i), p.getY(i), p.getZ(i)).filter((e) => e[1] > 1e-3).sort((a, b) => b[1] - a[1]).slice(0, 4); const t = w.reduce((a, e) => a + e[1], 0) || 1; w.forEach((e, k) => { si[i * 4 + k] = sk.index[e[0]]; sw[i * 4 + k] = e[1] / t; }); }
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); return g;
}
const rigid = (bone) => () => [[bone, 1]];
/** Blend between two bones along an axis value v from a to b. */
const blend = (b1, b2, a, b) => (x, y, z, v) => { const t = smooth(a, b, v); return [[b1, 1 - t], [b2, t]]; };
function paint(g, fn) { g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const col = fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); c.set(col, i * 3); } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
/** Tube along points with radii; radial cross-section scaled by sx, sz (ellipse). */
function tube(pts, radii, radial, o = {}) {
  const pos = [], idx = []; let prevN = null;
  pts.forEach((pt, s) => {
    const a = pts[Math.max(0, s - 1)], b = pts[Math.min(pts.length - 1, s + 1)], T = new THREE.Vector3().subVectors(b, a).normalize();
    let N = prevN ? prevN.clone().sub(T.clone().multiplyScalar(prevN.dot(T))).normalize() : (Math.abs(T.z) < 0.9 ? new THREE.Vector3(0, 0, 1).cross(T).normalize() : new THREE.Vector3(1, 0, 0).cross(T).normalize()); prevN = N;
    const B = new THREE.Vector3().crossVectors(T, N);
    for (let r = 0; r <= radial; r++) { const ang = (r / radial) * Math.PI * 2; const rr = typeof radii[s] === 'function' ? radii[s](ang) : radii[s]; const q = pt.clone().addScaledVector(N, Math.cos(ang) * rr * (o.sx || 1)).addScaledVector(B, Math.sin(ang) * rr * (o.sz || 1)); pos.push(q.x, q.y, q.z); }
  });
  for (let s = 0; s < pts.length - 1; s++) for (let r = 0; r < radial; r++) { const a = s * (radial + 1) + r, b = a + 1, c = a + radial + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  if (o.cap) { const c0 = pos.length / 3; const e = pts[pts.length - 1]; pos.push(e.x, e.y, e.z); const s = pts.length - 1; for (let r = 0; r < radial; r++) idx.push(c0, s * (radial + 1) + r, s * (radial + 1) + r + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g.toNonIndexed();
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const line = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a.clone().lerp(b, i / n));
/** Merges parts into one painted, skinned geometry: parts = [{g, col(x,y,z,nx,ny,nz)->rgb, w(x,y,z)->weights}]. */
function build(parts, sk, keepUv) { return mergeGeometries(parts.map(({ g, col, w }) => { let gg = (g.index ? g.toNonIndexed() : g).clone(); if (!keepUv) gg.deleteAttribute('uv'); if (gg.attributes.normal) gg.deleteAttribute('normal'); gg = mergeVertices(gg, 1e-4); paint(gg, col); gg = gg.toNonIndexed(); skin(gg, sk, w); if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); return gg; })); }

/* ---------- animation ---------- */
/** Clip from keys [[t, {bone:[rx,ry,rz] degrees, '@hips':[x,y,z] offset}], ...]. Bones absent from a key are at rest. */
function clip(name, dur, keys, sk, loop) {
  const bones = new Set(); keys.forEach(([, k]) => Object.keys(k).forEach((b) => b[0] !== '@' && bones.add(b)));
  const tracks = [];
  for (const b of bones) { const times = [], vals = []; keys.forEach(([t, k]) => { const e = k[b] || [0, 0, 0]; const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(e[0] * D, e[1] * D, e[2] * D)); times.push(t); vals.push(q.x, q.y, q.z, q.w); }); tracks.push(new THREE.QuaternionKeyframeTrack(b + '.quaternion', times, vals)); }
  for (const [tag, bone] of Object.entries(sk.posKeys || {})) { if (!keys.some(([, k]) => k[tag])) continue; const rest = sk.bones[bone].position; const times = [], vals = []; keys.forEach(([t, k]) => { const o = k[tag] || [0, 0, 0]; times.push(t); vals.push(rest.x + o[0], rest.y + o[1], rest.z + o[2]); }); tracks.push(new THREE.VectorKeyframeTrack(bone + '.position', times, vals)); }
  const c = new THREE.AnimationClip(name, dur, tracks); c.userData = { loop }; return c;
}
/** Samples a pose function f(phase 0..1) into keys. */
const cyc = (dur, n, f) => Array.from({ length: n + 1 }, (_, i) => [dur * i / n, f(i / n)]);
const S = Math.sin, C = Math.cos, TAU = Math.PI * 2;

/* ---------- painted face texture (256x256): whites, lashes, brows, mouth; iris and highlights ---------- */
function faceTexture() {
  const W = 256, buf = new Float32Array(W * W * 4);
  const dab = (cx, cy, rx, ry, ang, col, a = 1) => { const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.max(rx, ry) + 2; for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(W, cy + R); y++) for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(W, cx + R); x++) { const dx = x - cx, dy = y - cy, u = (dx * ca + dy * sa) / rx, v = (-dx * sa + dy * ca) / ry, d = Math.hypot(u, v); const cov = clamp((1 - d) * Math.min(rx, ry), 0, 1) * a; if (cov <= 0) continue; const k = (y * W + x) * 4; for (let c = 0; c < 3; c++) buf[k + c] = buf[k + c] * (1 - cov) + col[c] * cov; buf[k + 3] = buf[k + 3] + (1 - buf[k + 3]) * cov; } };
  // top half: one eye (mirrored on the mesh). Eye white, upper lash line, lower lash, brow.
  dab(64, 64, 46, 40, 0, [0.97, 0.95, 0.92]);
  for (let i = 0; i <= 30; i++) { const t = i / 30, x = 18 + t * 96, y = 36 - Math.sin(t * Math.PI) * 14 + t * 4; dab(x, y, 7 - t * 2, 5, 0, [0.16, 0.11, 0.12]); }
  dab(116, 38, 10, 4, -0.5, [0.16, 0.11, 0.12]);
  for (let i = 0; i <= 12; i++) { const t = i / 12; dab(40 + t * 48, 104 + Math.sin(t * Math.PI) * 3, 2.2, 2.2, 0, [0.4, 0.25, 0.25], 0.8); }
  for (let i = 0; i <= 20; i++) { const t = i / 20; dab(26 + t * 80, 12 - Math.sin(t * Math.PI) * 6 + t * 3, 6 - t * 3, 3.5, 0, [0.3, 0.2, 0.15]); }
  // iris (top right): dark ring to lighter centre, pupil, two highlights (art bible §6.3)
  for (let r = 44; r > 0; r -= 2) { const t = 1 - r / 44; dab(192, 64, r, r * 1.05, 0, [0.18 + 0.6 * t * t, 0.18 + 0.6 * t * t, 0.2 + 0.6 * t * t]); }
  dab(192, 66, 16, 18, 0, [0.06, 0.05, 0.07]); dab(178, 46, 11, 9, -0.4, [1, 1, 1]); dab(204, 84, 5, 4, 0, [1, 1, 1], 0.8);
  // mouth (bottom left): small soft line
  for (let i = 0; i <= 16; i++) { const t = i / 16; dab(32 + t * 64, 176 + Math.sin(t * Math.PI) * 6, 3, 2.5, 0, [0.55, 0.28, 0.3]); }
  // skin blush (bottom right)
  dab(192, 192, 40, 22, 0, [0.95, 0.62, 0.6], 0.6);
  const out = new Uint8Array(W * W * 4); for (let i = 0; i < W * W * 4; i++) out[i] = Math.round(clamp(buf[i], 0, 1) * 255);
  for (let i = 0; i < W * W; i++) if (out[i * 4 + 3] < 4) { out[i * 4] = 230; out[i * 4 + 1] = 200; out[i * 4 + 2] = 180; }
  const t = new THREE.DataTexture(out, W, W, THREE.RGBAFormat); t.flipY = false; t.needsUpdate = true; t.name = 'tex_chr_face';
  const p = new PNG({ width: W, height: W }); p.data = Buffer.from(out); return { tex: t, png: PNG.sync.write(p) };
}
/** Front surface of the adventurer's head at (x, y): inverts the head's deformation (see adventurer()). */
function headZ(x, y) { const y0 = (y - 1.56) / 1.08, low = smooth(0.02, -0.13, y0), x0 = x / (1 - low * 0.32); const z0 = Math.sqrt(Math.max(0, 0.135 * 0.135 - x0 * x0 - y0 * y0)); return z0 * (1 - low * 0.12) + (y0 < -0.06 ? low * 0.025 : 0) + 0.012; }
/** A quad (decal) laid on the face surface, `lift` in front of it, UVs from a rect of the face texture. */
function decal(cx, cy, lift, w, h, rect, curve, flipU) {
  const g = new THREE.PlaneGeometry(w, h, 6, 4); const p = g.attributes.position, uv = g.attributes.uv; const [u0, v0, u1, v1] = rect;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setXYZ(i, cx + x, cy + y, headZ(cx + x, cy + y) + lift); const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, flipU ? u1 - (u1 - u0) * u : u0 + (u1 - u0) * u, v0 + (v1 - v0) * (1 - v)); }
  return g.toNonIndexed();
}

/* ---------- the adventurer ---------- */
function adventurer() {
  const sk = skeleton([
    ['root', null, 0, 0, 0], ['hips', 'root', 0, 0.92, 0], ['spine', 'hips', 0, 1.02, 0], ['chest', 'spine', 0, 1.18, 0], ['neck', 'chest', 0, 1.37, 0], ['head', 'neck', 0, 1.44, 0.01],
    ['eyes', 'head', 0, 1.555, 0.115], ['hair', 'head', 0, 1.58, -0.1],
    ['upperArm.L', 'chest', 0.175, 1.33, 0], ['lowerArm.L', 'upperArm.L', 0.205, 1.07, 0], ['hand.L', 'lowerArm.L', 0.225, 0.83, 0.01],
    ['upperArm.R', 'chest', -0.175, 1.33, 0], ['lowerArm.R', 'upperArm.R', -0.205, 1.07, 0], ['hand.R', 'lowerArm.R', -0.225, 0.83, 0.01],
    ['upperLeg.L', 'hips', 0.09, 0.9, 0], ['lowerLeg.L', 'upperLeg.L', 0.095, 0.5, 0.01], ['foot.L', 'lowerLeg.L', 0.095, 0.09, -0.01],
    ['upperLeg.R', 'hips', -0.09, 0.9, 0], ['lowerLeg.R', 'upperLeg.R', -0.095, 0.5, 0.01], ['foot.R', 'lowerLeg.R', -0.095, 0.09, -0.01],
    ['cape1', 'chest', 0, 1.33, -0.14], ['cape2', 'cape1', 0, 1.05, -0.18], ['cape3', 'cape2', 0, 0.76, -0.21], ['weapon', 'hand.R', -0.23, 0.78, 0.04],
  ]);
  sk.posKeys = { '@hips': 'hips' };
  const A = sk.abs, L = (s) => s === 1 ? 'L' : 'R';
  const skinC = hex('#f2d6c0'), skinS = hex('#d9a993');
  const tone = (a, b) => (x, y, z, nx, ny) => mix(b, a, clamp(0.6 + ny * 0.25 + nz_(z) * 0.1, 0, 1));
  const nz_ = (z) => clamp(z * 4, -1, 1);
  const parts = { skin: [], hair: [], cloth: [], trim: [], leather: [], metal: [], face: [], iris: [] };
  // head: anime cranium, narrower chin
  { let g = new THREE.SphereGeometry(0.135, 24, 18); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const low = smooth(0.02, -0.13, y); x *= 1 - low * 0.32; z *= 1 - low * 0.12; if (y < -0.06) z += low * 0.025; y *= 1.08; p.setXYZ(i, x, y + 1.56, z + 0.012); } parts.skin.push({ g, col: tone(skinC, skinS), w: rigid('head') }); }
  // neck
  parts.skin.push({ g: tube(line(V(0, 1.34, 0), V(0, 1.47, 0.005), 3), [0.048, 0.048, 0.046, 0.046], 10), col: tone(skinC, skinS), w: (x, y, z) => { const t = smooth(1.38, 1.45, y); return [['chest', (1 - t) * 0.5], ['neck', 0.5], ['head', t * 0.5]]; } });
  // ears: human (round) and elf (long, pointed) -- the runtime shows one by kind
  for (const s of [1, -1]) {
    parts.skin.push({ g: new THREE.SphereGeometry(0.026, 8, 6).scale(0.5, 1, 0.8).translate(s * 0.128, 1.55, -0.005), col: tone(skinC, skinS), w: rigid('head'), tag: 'ear_human' });
    const pts = [V(s * 0.12, 1.55, -0.01), V(s * 0.165, 1.575, -0.025), V(s * 0.215, 1.61, -0.045)]; parts.skin.push({ g: tube(pts, [0.026, 0.017, 0.002], 8, { sz: 0.45 }), col: tone(skinC, skinS), w: rigid('head'), tag: 'ear_elf' });
  }
  // arms: sleeves (cloth) shoulder to forearm, gloves (leather), hands (skin)
  for (const s of [1, -1]) {
    const sh = A['upperArm.' + L(s)], el = A['lowerArm.' + L(s)], wr = A['hand.' + L(s)];
    const armW = (x, y) => { const t = smooth(el.y + 0.05, el.y - 0.05, y), u = smooth(sh.y - 0.02, sh.y + 0.06, y); return [['upperArm.' + L(s), (1 - t) * (1 - u)], ['lowerArm.' + L(s), t], ['chest', u]]; };
    parts.cloth.push({ g: tube([...line(sh.clone().add(V(0, 0.05, 0)), el, 4), ...line(el, wr.clone().add(V(0, 0.06, 0)), 3).slice(1)], [0.058, 0.056, 0.052, 0.05, 0.047, 0.046, 0.045, 0.05], 12), col: tone(hex('#ffffff'), hex('#b8b8b8')), w: armW });
    parts.leather.push({ g: tube(line(wr.clone().add(V(0, 0.08, 0)), wr.clone().add(V(0, -0.01, 0)), 2), [0.052, 0.046, 0.043], 10), col: tone(hex('#ffffff'), hex('#9a9a9a')), w: rigid('hand.' + L(s)) });
    parts.skin.push({ g: new THREE.SphereGeometry(0.042, 10, 8).scale(0.75, 1.25, 0.9).translate(wr.x + s * 0.004, wr.y - 0.06, wr.z + 0.005), col: tone(skinC, skinS), w: rigid('hand.' + L(s)) });
    parts.skin.push({ g: new THREE.SphereGeometry(0.016, 6, 5).scale(1, 1.6, 1).translate(wr.x - s * 0.01, wr.y - 0.035, wr.z + 0.035), col: tone(skinC, skinS), w: rigid('hand.' + L(s)) });
  }
  // legs: trousers, knee-high boots, feet
  for (const s of [1, -1]) {
    const hp = A['upperLeg.' + L(s)], kn = A['lowerLeg.' + L(s)], an = A['foot.' + L(s)];
    const legW = (x, y) => { const t = smooth(kn.y + 0.05, kn.y - 0.05, y), u = smooth(hp.y - 0.05, hp.y + 0.05, y); return [['upperLeg.' + L(s), (1 - t) * (1 - u)], ['lowerLeg.' + L(s), t], ['hips', u]]; };
    parts.cloth.push({ g: tube(line(hp.clone().add(V(0, 0.06, 0)), kn, 5), [0.085, 0.083, 0.078, 0.072, 0.066, 0.062], 12), col: tone(hex('#5e5648'), hex('#3c3630')), w: legW });
    parts.leather.push({ g: tube(line(kn.clone().add(V(0, 0.06, 0)), an.clone().add(V(0, -0.02, 0)), 5), [0.066, 0.062, 0.056, 0.05, 0.05, 0.055], 12), col: tone(hex('#ffffff'), hex('#8a8a8a')), w: legW });
    let foot = new THREE.SphereGeometry(0.06, 12, 8, 0, TAU, 0, Math.PI * 0.55).scale(0.85, 0.9, 1.9).translate(an.x, 0.0, an.z + 0.05); parts.leather.push({ g: foot, col: tone(hex('#ffffff'), hex('#8a8a8a')), w: rigid('foot.' + L(s)) });
  }
  // torso: tunic body and flared skirt (cloth), belt and buckle, collar trim, pauldron, satchel
  { const prof = [[0.86, 0.15], [0.92, 0.145], [1.0, 0.135], [1.1, 0.14], [1.2, 0.152], [1.3, 0.15], [1.36, 0.1]];
    const pts = prof.map(([y]) => V(0, y, 0)), rad = prof.map(([, r]) => (a) => r * (1 + 0.12 * Math.cos(2 * a)));
    parts.cloth.push({ g: tube(pts, rad, 16, { sz: 0.72 }), col: (x, y, z, nx, ny) => mix(hex('#c8c8c8'), hex('#ffffff'), clamp(0.5 + ny * 0.3 + 0.2 * Math.abs(nx), 0, 1)), w: (x, y) => { const a = smooth(0.96, 1.08, y), b = smooth(1.14, 1.26, y); return [['hips', 1 - a], ['spine', a * (1 - b)], ['chest', b]]; } });
    const sk2 = [[0.95, 0.15], [0.86, 0.17], [0.76, 0.2], [0.66, 0.235]]; const sp = sk2.map(([y]) => V(0, y, 0.005)), sr = sk2.map(([, r]) => r);
    parts.cloth.push({ g: tube(sp, sr, 20, { sz: 0.78 }), col: (x, y) => mix(hex('#9a9a9a'), hex('#ffffff'), smooth(0.64, 0.95, y)), w: (x, y) => { const d = smooth(0.93, 0.7, y); const side = x > 0 ? 'upperLeg.L' : 'upperLeg.R'; return [['hips', 1 - d * 0.7], [side, d * 0.7]]; } });
    parts.leather.push({ g: tube(line(V(0, 0.93, 0), V(0, 0.985, 0), 1), [0.156, 0.152], 20, { sz: 0.74 }), col: () => hex('#ffffff'), w: rigid('hips') });
    parts.metal.push({ g: new THREE.BoxGeometry(0.05, 0.04, 0.012).translate(0, 0.957, 0.118), col: () => [1, 1, 1], w: rigid('hips') });
    parts.trim.push({ g: tube(line(V(0, 1.31, 0.0), V(0, 1.375, 0.0), 1), [0.13, 0.075], 16, { sz: 0.85 }), col: tone(hex('#ffffff'), hex('#b0b0b0')), w: (x, y) => [['chest', 0.7], ['neck', 0.3]] });
    parts.leather.push({ g: new THREE.SphereGeometry(0.085, 12, 8, 0, TAU, 0, Math.PI * 0.5).scale(1.1, 0.7, 1.05).translate(-0.19, 1.33, 0), col: tone(hex('#ffffff'), hex('#8a8a8a')), w: rigid('upperArm.R') });
    parts.leather.push({ g: new THREE.BoxGeometry(0.1, 0.11, 0.05).translate(0.17, 0.86, 0.06), col: tone(hex('#ffffff'), hex('#8a8a8a')), w: (x, y) => [['hips', 0.6], ['upperLeg.L', 0.4]] });
  }
  // mantle: a cloth drape from the shoulders down the back, skinned to the cape chain
  { const W = 0.27, rows = 10, cols = 10, pos = [], idx = [];
    for (let j = 0; j <= rows; j++) { const t = j / rows, y = 1.37 - t * 0.68, w = W * (0.7 + 0.45 * t); for (let i = 0; i <= cols; i++) { const u = i / cols - 0.5, a = u * Math.PI * (0.95 - 0.35 * t), x = Math.sin(a) * w * 1.1, z = -0.06 - Math.cos(a) * (0.11 + 0.05 * t) - t * 0.05 + (j === 0 ? 0.03 : 0) + 0.012 * Math.sin(u * 18) * t; pos.push(x, y, z); } }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g = g.toNonIndexed();
    parts.trim.push({ g, col: (x, y) => mix(hex('#8a8a8a'), hex('#ffffff'), smooth(0.7, 1.35, y)) , w: (x, y) => { const a = smooth(1.3, 1.1, y), b = smooth(1.0, 0.8, y); return [['chest', 1 - a], ['cape1', a * (1 - b) * 0.5 + 0.0], ['cape2', a * (1 - b) * 0.5 + b * 0.3], ['cape3', b * 0.7]]; }, double: true }); }
  // hair: a cap over the cranium, bangs, side locks, and back locks on the hair bone
  { let cap = new THREE.SphereGeometry(0.148, 22, 14, 0, TAU, 0, Math.PI * 0.56); const p = cap.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); let X = x * 1.02, Y = y * 1.1 + 1.565, Z = z * 1.06 - 0.008; if (Z > 0.0) { const hl = 1.6 + 0.035 * Math.min(1, Math.abs(X) / 0.13) - 0.012 * Math.max(0, 1 - Math.abs(X) / 0.05); const f = smooth(0.0, 0.07, Z); if (Y < hl) Y = Y + (hl - Y) * f; } p.setXYZ(i, X, Y, Z); } parts.hair.push({ g: cap, col: (x, y, z, nx, ny) => mix(hex('#9a9a9a'), hex('#ffffff'), clamp(0.4 + ny * 0.5 + (hash(Math.round(Math.atan2(z, x) * 30)) - 0.5) * 0.2, 0, 1)), w: rigid('head') });
    const lock = (root, dir, len, w, n, bone) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(root.clone().add(dir.clone().multiplyScalar(len * t)).add(V(0, -t * t * len * 0.25, 0))); } return { g: tube(pts, pts.map((_, i) => w * (1 - i / (n + 0.6))), 6, { sz: 0.5 }), col: (x, y) => mix(hex('#8a8a8a'), hex('#ffffff'), smooth(1.35, 1.7, y)), w: bone }; };
    for (let k = -2; k <= 2; k++) parts.hair.push(lock(V(k * 0.045, 1.69, 0.105), V(k * 0.18, -0.5, 0.55).normalize(), 0.105, 0.042, 4, rigid('head')));
    for (const s of [1, -1]) { parts.hair.push(lock(V(s * 0.12, 1.62, 0.05), V(s * 0.25, -1, 0.15).normalize(), 0.2, 0.034, 5, rigid('head'))); parts.hair.push(lock(V(s * 0.1, 1.63, -0.04), V(s * 0.15, -1, -0.2).normalize(), 0.24, 0.036, 5, (x, y) => [['head', smooth(1.4, 1.6, y)], ['hair', 1 - smooth(1.4, 1.6, y)]])); }
    for (let k = -2; k <= 2; k++) parts.hair.push(lock(V(k * 0.05, 1.63, -0.12), V(k * 0.12, -1, -0.35).normalize(), 0.3, 0.045, 6, (x, y) => [['head', smooth(1.35, 1.6, y)], ['hair', 1 - smooth(1.35, 1.6, y)]])); }
  // face decals (textured): eyes (whites + lashes + brow) mirrored, mouth; iris on the eye bone
  for (const s of [1, -1]) {
    parts.face.push({ g: decal(s * 0.05, 1.56, 0.0025, 0.086, 0.086, [0, 0, 0.5, 0.5], 0, s < 0), col: () => [1, 1, 1], w: (x, y) => [['head', 0.4], ['eyes', 0.6]] });
    parts.iris.push({ g: decal(s * 0.048, 1.552, 0.0045, 0.043, 0.048, [0.5, 0, 1, 0.5], 0, false), col: () => [1, 1, 1], w: rigid('eyes') });
  }
  parts.face.push({ g: decal(0, 1.49, 0.0025, 0.075, 0.06, [0, 0.5, 0.5, 1], 0, false), col: () => [1, 1, 1], w: rigid('head') });
  for (const s of [1, -1]) parts.face.push({ g: decal(s * 0.07, 1.515, 0.0015, 0.05, 0.03, [0.5, 0.5, 1, 1], 0, false), col: () => [1, 1, 1], w: rigid('head') });
  // sword in the right hand (along -Y from the grip, pointing down-forward at rest)
  { const grip = A['weapon']; const blade = new THREE.BoxGeometry(0.045, 0.62, 0.012).translate(grip.x, grip.y - 0.42, grip.z); const p = blade.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < grip.y - 0.7) p.setX(i, grip.x);
    parts.metal.push({ g: blade, col: (x, y, z, nx) => mix(hex('#c9d2d8'), hex('#f2f6f8'), Math.abs(nx)), w: rigid('weapon') });
    parts.leather.push({ g: new THREE.CylinderGeometry(0.018, 0.018, 0.13, 8).translate(grip.x, grip.y - 0.0, grip.z), col: () => hex('#6a4a30'), w: rigid('weapon') });
    parts.metal.push({ g: new THREE.BoxGeometry(0.16, 0.025, 0.03).translate(grip.x, grip.y - 0.08, grip.z), col: () => hex('#d8c27a'), w: rigid('weapon') });
    parts.metal.push({ g: new THREE.SphereGeometry(0.022, 8, 6).translate(grip.x, grip.y + 0.075, grip.z), col: () => hex('#d8c27a'), w: rigid('weapon') }); }

  // ---------- clips (character faces +Z; legs hang along -Y: +X rotation swings a limb back, -X forward) ----------
  const keysIdle = cyc(3, 12, (p) => { const b = S(p * TAU); return { '@hips': [0, b * 0.006, 0], spine: [b * 1.2, 0, 0], chest: [-b * 1.5, 0, 0], head: [b * 1.5, S(p * TAU * 0.5) * 4, 0], 'upperArm.L': [2, 0, 8 + b * 1.5], 'upperArm.R': [-6, 0, -8 - b * 1.5], 'lowerArm.L': [-8, 0, 0], 'lowerArm.R': [-28, 0, 0], 'hand.R': [10, 0, 0], cape1: [4 + b * 2, 0, 0], cape2: [3 + b * 2, 0, 0], cape3: [2 + b * 3, 0, 0], hair: [b * 3, 0, 0], 'upperLeg.L': [0, 0, 2], 'upperLeg.R': [0, 0, -2] }; });
  const loco = (dur, n, amp, lean, bob, arm, knee, capeLag) => cyc(dur, n, (p) => { const a = p * TAU, s = S(a), c = C(a); return { '@hips': [0, -Math.abs(c) * bob + bob * 0.5, 0], hips: [0, s * 6 * amp, 0], spine: [lean, -s * 5 * amp, 0], chest: [lean * 0.4, -s * 6 * amp, 0], head: [-lean * 0.8, s * 4 * amp, 0], 'upperLeg.L': [-s * 32 * amp, 0, 2], 'upperLeg.R': [s * 32 * amp, 0, -2], 'lowerLeg.L': [knee * Math.max(0, -C(a - 0.6)) + 8, 0, 0], 'lowerLeg.R': [knee * Math.max(0, C(a - 0.6)) + 8, 0, 0], 'foot.L': [-Math.max(0, s) * 18 * amp, 0, 0], 'foot.R': [-Math.max(0, -s) * 18 * amp, 0, 0], 'upperArm.L': [s * arm, 0, 10], 'upperArm.R': [-s * arm * 0.6 - 12, 0, -12], 'lowerArm.L': [-18 - Math.max(0, -s) * 25 * amp, 0, 0], 'lowerArm.R': [-45, 0, 0], cape1: [capeLag + c * 4, 0, 0], cape2: [capeLag * 0.8 + C(a - 0.6) * 6, 0, 0], cape3: [capeLag * 0.6 + C(a - 1.2) * 8, 0, 0], hair: [capeLag * 0.5 + c * 5, 0, 0] }; });
  const keysWalk = loco(1.0, 16, 0.8, 4, 0.025, 22, 40, 10);
  const keysRun = loco(0.62, 16, 1.35, 16, 0.06, 50, 85, 40);
  const crouch = { '@hips': [0, -0.14, 0], spine: [18, 0, 0], 'upperLeg.L': [-40, 0, 4], 'upperLeg.R': [-40, 0, -4], 'lowerLeg.L': [70, 0, 0], 'lowerLeg.R': [70, 0, 0], 'foot.L': [-30, 0, 0], 'foot.R': [-30, 0, 0], 'upperArm.L': [20, 0, 15], 'upperArm.R': [20, 0, -15], 'lowerArm.R': [-40, 0, 0] };
  const air = { '@hips': [0, 0.02, 0], spine: [-6, 0, 0], 'upperLeg.L': [-50, 0, 6], 'upperLeg.R': [-10, 0, -6], 'lowerLeg.L': [70, 0, 0], 'lowerLeg.R': [55, 0, 0], 'upperArm.L': [-30, 0, 40], 'upperArm.R': [-40, 0, -45], 'lowerArm.L': [-30, 0, 0], 'lowerArm.R': [-50, 0, 0], cape1: [45, 0, 0], cape2: [30, 0, 0], cape3: [20, 0, 0], hair: [25, 0, 0] };
  const keysJump = [[0, crouch], [0.12, { ...air, '@hips': [0, 0.05, 0] }], [0.45, air], [0.72, { ...air, 'upperLeg.L': [-30, 0, 6], 'lowerLeg.L': [40, 0, 0] }]];
  const roll = (k) => ({ '@hips': [0, -0.3 * k, 0.1 * k], hips: [70 * k, 0, 0], spine: [30 * k, 0, 0], head: [20 * k, 0, 0], 'upperLeg.L': [-90 * k, 0, 0], 'upperLeg.R': [-80 * k, 0, 0], 'lowerLeg.L': [110 * k, 0, 0], 'lowerLeg.R': [120 * k, 0, 0], 'upperArm.L': [-60 * k, 0, 20], 'upperArm.R': [-60 * k, 0, -20], 'lowerArm.R': [-60, 0, 0], cape1: [50 * k, 0, 0], cape2: [40 * k, 0, 0] });
  const keysDodge = [[0, roll(0.3)], [0.12, roll(0.9)], [0.3, roll(1)], [0.42, roll(0.5)], [0.5, roll(0.1)]];
  const ready = { spine: [6, 20, 0], chest: [0, 25, 0], 'upperArm.R': [-40, 30, -60], 'lowerArm.R': [-70, 0, 0], 'hand.R': [-20, 0, 0], 'upperArm.L': [-10, 0, 25], 'lowerArm.L': [-30, 0, 0], 'upperLeg.L': [-20, 0, 6], 'upperLeg.R': [12, 0, -6], 'lowerLeg.L': [20, 0, 0], 'lowerLeg.R': [15, 0, 0], '@hips': [0, -0.04, 0] };
  const slash = { spine: [12, -30, 0], chest: [6, -35, 0], 'upperArm.R': [-75, -40, -30], 'lowerArm.R': [-10, 0, 0], 'hand.R': [30, 0, 0], 'upperArm.L': [10, 0, 30], 'lowerArm.L': [-30, 0, 0], 'upperLeg.L': [-35, 0, 6], 'upperLeg.R': [20, 0, -6], 'lowerLeg.L': [25, 0, 0], 'lowerLeg.R': [25, 0, 0], '@hips': [0, -0.07, 0.04], cape1: [15, 0, 0], cape2: [12, 0, 0] };
  const keysAttack = [[0, { ...ready, spine: [4, 10, 0] }], [0.1, ready], [0.2, slash], [0.32, { ...slash, 'upperArm.R': [-60, -45, -20] }], [0.45, { ...slash, spine: [6, -10, 0], chest: [0, -12, 0], 'upperArm.R': [-30, -20, -15] }]];
  const keysHit = [[0, {}], [0.07, { spine: [-16, 6, 0], chest: [-10, 0, 0], head: [-18, 0, 6], 'upperArm.L': [20, 0, 35], 'upperArm.R': [20, 0, -35], '@hips': [0, -0.03, -0.05], cape1: [-10, 0, 0] }], [0.35, {}]];
  const down = { '@hips': [0, -0.78, -0.25], hips: [-82, 0, 0], spine: [-6, 0, 0], head: [-12, 25, 0], 'upperLeg.L': [-6, 0, 10], 'upperLeg.R': [-4, 0, -8], 'lowerLeg.L': [10, 0, 0], 'lowerLeg.R': [16, 0, 0], 'upperArm.L': [-120, 0, 30], 'upperArm.R': [-140, 0, -50], 'lowerArm.L': [-10, 0, 0], cape1: [-60, 0, 0], cape2: [-10, 0, 0] };
  const keysDeath = [[0, {}], [0.25, { '@hips': [0, -0.12, 0], spine: [-20, 0, 0], head: [-20, 0, 0], 'upperLeg.L': [-30, 0, 0], 'lowerLeg.L': [60, 0, 0], 'upperArm.L': [10, 0, 40], 'upperArm.R': [10, 0, -40] }], [0.6, { '@hips': [0, -0.45, -0.1], hips: [-30, 0, 0], spine: [-20, 0, 0], 'upperLeg.L': [-70, 0, 0], 'upperLeg.R': [-70, 0, 0], 'lowerLeg.L': [110, 0, 0], 'lowerLeg.R': [110, 0, 0] }], [1.0, down], [1.6, down]];
  const reach = { spine: [14, 0, 0], head: [16, 0, 0], 'upperArm.L': [-70, 0, 10], 'lowerArm.L': [-30, 0, 0], 'hand.L': [-10, 0, 0], 'upperArm.R': [-6, 0, -10], 'lowerArm.R': [-30, 0, 0], '@hips': [0, -0.03, 0] };
  const keysInteract = [[0, {}], [0.35, reach], [0.8, { ...reach, head: [26, 0, 0], 'hand.L': [-30, 0, 0] }], [1.1, reach], [1.4, {}]];
  const keysCast = [[0, {}], [0.12, { spine: [8, 0, 0], 'upperArm.L': [-80, 0, 15], 'upperArm.R': [-80, 0, -15], 'lowerArm.L': [-20, 0, 0], 'lowerArm.R': [-20, 0, 0], head: [-6, 0, 0], cape1: [20, 0, 0] }], [0.4, { spine: [10, 0, 0], 'upperArm.L': [-95, 0, 20], 'upperArm.R': [-95, 0, -20], 'lowerArm.L': [-10, 0, 0], 'lowerArm.R': [-10, 0, 0], cape1: [25, 0, 0] }], [0.5, { 'upperArm.L': [-60, 0, 15], 'upperArm.R': [-60, 0, -15] }]];
  const keysClimb = cyc(0.8, 8, (p) => { const s = S(p * TAU); return { spine: [-14, 0, 0], head: [-20, 0, 0], 'upperArm.L': [-150 + s * 25, 0, 15], 'upperArm.R': [-150 - s * 25, 0, -15], 'lowerArm.L': [-30 - Math.max(0, s) * 50, 0, 0], 'lowerArm.R': [-30 - Math.max(0, -s) * 50, 0, 0], 'upperLeg.L': [-50 + s * 30, 0, 8], 'upperLeg.R': [-50 - s * 30, 0, -8], 'lowerLeg.L': [70 - s * 30, 0, 0], 'lowerLeg.R': [70 + s * 30, 0, 0], cape1: [-20, 0, 0] }; });
  const clips = [clip('idle', 3, keysIdle, sk, true), clip('walk', 1.0, keysWalk, sk, true), clip('run', 0.62, keysRun, sk, true), clip('jump', 0.72, keysJump, sk, false), clip('dodge', 0.5, keysDodge, sk, false), clip('attack', 0.45, keysAttack, sk, false), clip('hit', 0.35, keysHit, sk, false), clip('death', 1.6, keysDeath, sk, false), clip('interact', 1.4, keysInteract, sk, false), clip('cast', 0.5, keysCast, sk, false), clip('climb', 0.8, keysClimb, sk, true)];
  return { sk, parts, clips, meta: { stride: { walk: 1.7, run: 7 }, height: 1.7 } };
}

/* ---------- quadrupeds (creatures) ---------- */
/** Quadruped from proportions o; returns rig, painted parts and 6 clips. */
function quadruped(o) {
  const H = o.h, Lb = o.len, legH = o.legH;
  const sk = skeleton([
    ['root', null, 0, 0, 0], ['body', 'root', 0, legH + o.bodyR * 0.6, 0], ['chest', 'body', 0, legH + o.bodyR * 0.75, Lb * 0.35], ['neck', 'chest', 0, legH + o.bodyR * 1.1, Lb * 0.5], ['head', 'neck', 0, legH + o.bodyR * (o.headUp || 1.1), Lb * 0.5 + o.neckLen],
    ['tail', 'body', 0, legH + o.bodyR * 0.9, -Lb * 0.5],
    ...['FL', 'FR', 'BL', 'BR'].flatMap((k) => { const fx = k[1] === 'L' ? 1 : -1, z = k[0] === 'F' ? Lb * 0.36 : -Lb * 0.36; const x = fx * o.bodyR * 0.55; return [['leg' + k, k[0] === 'F' ? 'chest' : 'body', x, legH + o.bodyR * 0.2, z], ['shin' + k, 'leg' + k, x, legH * 0.5, z + (k[0] === 'F' ? 0.02 : -0.03)], ['hoof' + k, 'shin' + k, x, 0.04, z]]; }),
  ]);
  sk.posKeys = { '@body': 'body' };
  const parts = { body: [], dark: [], light: [] };
  const fur = (a, b) => (x, y, z, nx, ny) => mix(b, a, clamp(0.45 + ny * 0.45 + (hash(Math.round(x * 300) * 13 + Math.round(z * 300)) - 0.5) * 0.12, 0, 1));
  // torso
  { const n = 10, pts = [], rad = []; for (let i = 0; i <= n; i++) { const t = i / n, z = -Lb * 0.55 + Lb * 1.05 * t; pts.push(V(0, legH + o.bodyR * (0.75 + 0.12 * Math.sin(t * Math.PI) + (o.hump || 0) * smooth(0.55, 0.8, t)), z)); rad.push(o.bodyR * (0.55 + 0.45 * Math.sin(Math.PI * (0.08 + 0.84 * t)))); }
    parts.body.push({ g: tube(pts, rad, 14, { cap: true, sz: o.bodyW || 1 }), col: fur(o.c1, o.c2), w: (x, y, z) => { const t = smooth(-Lb * 0.1, Lb * 0.3, z); return [['body', 1 - t], ['chest', t]]; } }); }
  // neck + head
  { const a = V(0, legH + o.bodyR * 1.0, Lb * 0.42), b = sk.abs.head.clone(); parts.body.push({ g: tube(line(a, b, 4), [o.bodyR * 0.5, o.bodyR * 0.45, o.bodyR * 0.4, o.headR * 0.85, o.headR * 0.8], 10), col: fur(o.c1, o.c2), w: (x, y, z) => { const t = smooth(a.z, b.z, z); return [['chest', 1 - t], ['neck', t * 0.6], ['head', t * 0.4]]; } });
    const h = sk.abs.head; let head = new THREE.SphereGeometry(o.headR, 14, 10).scale(0.85, 0.9, 1.25).translate(h.x, h.y, h.z + o.headR * 0.4); parts.body.push({ g: head, col: fur(o.c1, o.c2), w: rigid('head') });
    let snout = tube([V(0, h.y - o.headR * 0.2, h.z + o.headR * 0.7), V(0, h.y - o.headR * (o.snoutDrop || 0.4), h.z + o.headR * 0.7 + o.snout)], [o.headR * 0.55, o.headR * (o.snoutTip || 0.4)], 10, { cap: true }); parts.body.push({ g: snout, col: fur(o.c1, o.c3 || o.c2), w: rigid('head') });
    for (const s of [1, -1]) { parts.dark.push({ g: new THREE.SphereGeometry(o.headR * 0.12, 8, 6).translate(s * o.headR * 0.55, h.y + o.headR * 0.15, h.z + o.headR * 0.75), col: () => hex('#120d0c'), w: rigid('head') });
      parts.body.push({ g: tube([V(s * o.headR * 0.45, h.y + o.headR * 0.6, h.z + o.headR * 0.1), V(s * o.headR * 0.85, h.y + o.headR * 1.0 + (o.earUp || 0), h.z - o.headR * 0.15)], [o.headR * 0.22, 0.004], 6, { sz: 0.4 }), col: fur(o.c1, o.c2), w: rigid('head') }); }
    if (o.tusks) for (const s of [1, -1]) parts.light.push({ g: tube([V(s * o.headR * 0.35, h.y - o.headR * 0.45, h.z + o.headR * 0.7 + o.snout * 0.8), V(s * o.headR * 0.55, h.y - o.headR * 0.1, h.z + o.headR * 0.8 + o.snout * 0.9), V(s * o.headR * 0.5, h.y + o.headR * 0.15, h.z + o.headR * 0.6 + o.snout * 0.9)], [o.headR * 0.09, o.headR * 0.07, 0.003], 6), col: () => hex('#efe4c8'), w: rigid('head') });
    if (o.antlers) for (const s of [1, -1]) { const base = V(s * o.headR * 0.35, h.y + o.headR * 0.75, h.z + o.headR * 0.1); const beam = [base, base.clone().add(V(s * 0.12, 0.25, -0.05)), base.clone().add(V(s * 0.22, 0.5, -0.12)), base.clone().add(V(s * 0.26, 0.72, -0.05))]; parts.light.push({ g: tube(beam, [0.03, 0.025, 0.02, 0.006], 6), col: () => hex('#e8f0ff'), w: rigid('head'), glow: true });
      for (let k = 1; k <= 2; k++) { const st = beam[k]; parts.light.push({ g: tube([st, st.clone().add(V(s * 0.04, 0.2, 0.12))], [0.018, 0.004], 5), col: () => hex('#e8f0ff'), w: rigid('head'), glow: true }); } }
    if (o.mane) { for (let k = 0; k < 9; k++) { const t = k / 8, z = Lb * 0.5 - t * Lb * 0.75; const y = legH + o.bodyR * (1.3 - t * 0.2); parts.dark.push({ g: tube([V(0, y - 0.05, z), V(0, y + o.mane * (0.6 + 0.4 * Math.sin(t * 3)), z - 0.05)], [0.05, 0.004], 5, { sz: 0.35 }), col: () => mix(hex('#2a1d14'), hex('#4a3423'), t), w: (x, yy, zz) => (t < 0.3 ? [['chest', 1]] : [['body', 1]]) }); } }
  }
  // legs
  for (const k of ['FL', 'FR', 'BL', 'BR']) { const a = sk.abs['leg' + k], b = sk.abs['shin' + k], c = sk.abs['hoof' + k];
    parts.body.push({ g: tube([a.clone().add(V(0, 0.05, 0)), a.clone().lerp(b, 0.5), b], [o.legR * 1.6, o.legR * 1.2, o.legR], 8), col: fur(o.c1, o.c2), w: (x, y) => { const t = smooth(b.y + 0.04, b.y - 0.04, y); return [['leg' + k, 1 - t], ['shin' + k, t]]; } });
    parts.body.push({ g: tube([b, c.clone().add(V(0, 0.02, 0))], [o.legR, o.legR * 0.8], 8), col: fur(o.c2, o.c2), w: rigid('shin' + k) });
    parts.dark.push({ g: tube([c.clone().add(V(0, 0.04, 0)), c.clone().add(V(0, -0.04, 0.015))], [o.legR * 0.95, o.legR * 1.05], 8, { cap: true }), col: () => hex('#1e1612'), w: rigid('hoof' + k) }); }
  // tail
  { const t0 = sk.abs.tail; parts.body.push({ g: tube([t0, t0.clone().add(V(0, -0.05, -o.tail * 0.5)), t0.clone().add(V(0, -o.tail * 0.6, -o.tail * 0.7))], [o.bodyR * 0.12, o.bodyR * 0.08, 0.01], 6), col: fur(o.c1, o.c2), w: rigid('tail') }); }
  // clips
  const legs = (s, amp, lift) => ({ legFL: [-s * amp, 0, 0], legBR: [-s * amp, 0, 0], legFR: [s * amp, 0, 0], legBL: [s * amp, 0, 0], shinFL: [-Math.max(0, -s) * lift, 0, 0], shinBR: [Math.max(0, -s) * lift, 0, 0], shinFR: [-Math.max(0, s) * lift, 0, 0], shinBL: [Math.max(0, s) * lift, 0, 0] });
  const keysIdle = cyc(3, 12, (p) => { const b = S(p * TAU); return { '@body': [0, b * 0.008, 0], neck: [o.grazeIdle ? 20 + 15 * Math.max(0, S(p * TAU)) : b * 3, S(p * TAU * 0.5) * 8, 0], head: [o.grazeIdle ? 25 * Math.max(0, S(p * TAU)) : 0, 0, 0], tail: [b * 10, S(p * TAU * 2) * 12, 0] }; });
  const gait = (dur, amp, lift, bob) => cyc(dur, 12, (p) => { const s = S(p * TAU), c = C(p * TAU); return { '@body': [0, Math.abs(c) * bob, 0], body: [s * 2, 0, 0], neck: [-c * 4, 0, 0], tail: [10 + c * 8, s * 10, 0], ...legs(s, amp, lift) }; });
  const gallop = (dur) => cyc(dur, 12, (p) => { const s = S(p * TAU), c = C(p * TAU); return { '@body': [0, Math.max(0, s) * 0.08, 0], body: [c * 8, 0, 0], neck: [-c * 8, 0, 0], tail: [30, 0, 0], legFL: [-s * 45, 0, 0], legFR: [-S(p * TAU - 0.3) * 45, 0, 0], legBL: [s * 40, 0, 0], legBR: [S(p * TAU - 0.3) * 40, 0, 0], shinFL: [-Math.max(0, -s) * 50, 0, 0], shinFR: [-Math.max(0, -S(p * TAU - 0.3)) * 50, 0, 0], shinBL: [Math.max(0, s) * 50, 0, 0], shinBR: [Math.max(0, S(p * TAU - 0.3)) * 50, 0, 0] }; });
  const keysAttack = o.attack === 'charge'
    ? [[0, {}], [0.2, { '@body': [0, -0.05, -0.05], body: [-6, 0, 0], neck: [20, 0, 0], head: [25, 0, 0], legFL: [10, 0, 0], legFR: [10, 0, 0] }], [0.35, { '@body': [0, 0.02, 0.12], body: [6, 0, 0], neck: [-25, 0, 0], head: [-30, 0, 0], legBL: [30, 0, 0], legBR: [30, 0, 0], legFL: [-30, 0, 0], legFR: [-30, 0, 0] }], [0.6, {}]]
    : [[0, {}], [0.25, { neck: [-30, 0, 0], head: [-20, 0, 0], legFL: [-50, 0, 0], shinFL: [-60, 0, 0] }], [0.4, { neck: [10, 0, 0], legFL: [10, 0, 0] }], [0.6, {}]];
  const keysHit = [[0, {}], [0.08, { '@body': [0, -0.03, -0.06], body: [-8, 0, 6], neck: [-15, 10, 0], head: [-10, 0, 0] }], [0.35, {}]];
  const downQ = { '@body': [0, -legH * 0.75, 0], body: [0, 0, 80], neck: [10, 0, -30], legFL: [-30, 0, 0], legBL: [30, 0, 0], legFR: [-10, 0, 0], legBR: [10, 0, 0] };
  const keysDeath = [[0, {}], [0.3, { '@body': [0, -0.1, 0], body: [-6, 0, 20], neck: [20, 0, 0] }], [0.8, downQ], [1.4, downQ]];
  // rest: lying down with legs folded, slow breathing (living-world habits: day creatures rest at night)
  const lie = (b) => ({ '@body': [0, -legH * 0.62 + b * 0.01, 0], neck: [18, 0, 0], head: [12, 0, 0], tail: [-10, 0, 0], legFL: [-70, 0, 0], legFR: [-70, 0, 0], shinFL: [120, 0, 0], shinFR: [120, 0, 0], legBL: [70, 0, 0], legBR: [70, 0, 0], shinBL: [-120, 0, 0], shinBR: [-120, 0, 0] });
  const keysRest = cyc(4, 8, (p) => lie(S(p * TAU)));
  const clips = [clip('rest', 4, keysRest, sk, true), clip('idle', 3, keysIdle, sk, true), clip('walk', 1.0, gait(1.0, 22, 30, 0.02), sk, true), clip('run', 0.5, o.gallop ? gallop(0.5) : gait(0.5, 38, 55, 0.05), sk, true), clip('attack', 0.6, keysAttack, sk, false), clip('hit', 0.35, keysHit, sk, false), clip('death', 1.4, keysDeath, sk, false)];
  return { sk, parts, clips, meta: { stride: { walk: o.walkSpeed, run: o.runSpeed }, height: H } };
}

/* ---------- export ---------- */
async function exportChar(file, rig, mats, faceTex) {
  const scene = new THREE.Scene(); const root = new THREE.Group(); root.name = 'character'; scene.add(root);
  root.add(rig.sk.list[0]);
  const skel = new THREE.Skeleton(rig.sk.list); root.updateMatrixWorld(true);
  const tris = {};
  for (const [m, list] of Object.entries(rig.parts)) {
    if (!list.length) continue;
    const byTag = {}; list.forEach((p) => { const k = p.tag || ''; (byTag[k] = byTag[k] || []).push(p); });
    for (const [tag, ps] of Object.entries(byTag)) {
      const g0 = build(ps.map((p) => ({ g: p.g, col: p.col, w: p.w })), rig.sk, m === 'face' || m === 'iris');
      const mat = mats[m].clone(); mat.name = 'chr-' + m;
      if (ps.some((p) => p.double)) mat.side = THREE.DoubleSide;
      const mesh = new THREE.SkinnedMesh(mergeVertices(g0, 1e-5), mat); mesh.name = m + (tag ? '_' + tag : ''); mesh.frustumCulled = false; root.add(mesh); mesh.bind(skel);
      tris[mesh.name] = mesh.geometry.index.count / 3;
    }
  }
  const glb = await new Promise((res, rej) => new GLTFExporter().parse(scene, res, rej, { binary: true, animations: rig.clips, onlyVisible: false }));
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  await MeshoptEncoder.ready;
  const doc = await io.readBinary(new Uint8Array(glb));
  doc.getRoot().getAsset().extras = { erandel: rig.meta };
  // the painted face texture (GLTFExporter needs a browser canvas for images, so it is attached here)
  const texMats = doc.getRoot().listMaterials().filter((m) => m.getName() === 'chr-face' || m.getName() === 'chr-iris');
  if (texMats.length) { const t = doc.createTexture('tex_chr_face').setImage(new Uint8Array(faceTex)).setMimeType('image/png'); texMats.forEach((m) => m.setBaseColorTexture(t).setAlphaMode('MASK').setAlphaCutoff(0.35)); }
  await doc.transform(dedup(), prune({ keepAttributes: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  fs.mkdirSync(path.dirname(file), { recursive: true }); await io.write(file, doc);
  return { bytes: fs.statSync(file).size, tris: Object.values(tris).reduce((a, b) => a + b, 0), parts: tris, bones: rig.sk.list.length, clips: rig.clips.map((c) => c.name) };
}
const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, vertexColors: true });
const face = faceTexture();
fs.mkdirSync(path.join(ROOT, 'assets', 'source', 'all'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'assets', 'source', 'all', 'tex_chr_face.png'), face.png);
const report = {};
report.adventurer = await exportChar(path.join(OUT, 'all', 'chr_all_adventurer.glb'), adventurer(), { skin: M('#ffffff'), hair: M('#d8c48a'), cloth: M('#3f6a4a'), trim: M('#2e4f3a'), leather: M('#6a4a30'), metal: M('#c8cdd2'), face: M('#ffffff'), iris: M('#5a8a5a') }, face.png);
report.boar = await exportChar(path.join(OUT, 'erelian', 'cre_erelian_thornback-boar.glb'), quadruped({ h: 1.0, len: 1.25, legH: 0.38, bodyR: 0.34, bodyW: 0.85, headR: 0.2, neckLen: 0.12, headUp: 0.9, snout: 0.2, snoutDrop: 0.5, snoutTip: 0.42, legR: 0.045, tail: 0.25, tusks: true, mane: 0.22, hump: 0.25, attack: 'charge', walkSpeed: 1.6, runSpeed: 5.5, c1: hex('#6a5038'), c2: hex('#3a2a1e'), c3: hex('#8a6a58') }), { body: M('#ffffff'), dark: M('#ffffff'), light: M('#ffffff') }, null);
report.stag = await exportChar(path.join(OUT, 'erelian', 'cre_erelian_lunar-stag.glb'), quadruped({ h: 1.7, len: 1.15, legH: 0.78, bodyR: 0.27, bodyW: 0.8, headR: 0.13, neckLen: 0.42, headUp: 2.4, snout: 0.14, snoutDrop: 0.3, snoutTip: 0.5, legR: 0.03, tail: 0.15, antlers: true, earUp: 0.05, grazeIdle: true, gallop: true, attack: 'rear', walkSpeed: 1.5, runSpeed: 8, c1: hex('#d6d2c6'), c2: hex('#8f8a80'), c3: hex('#f0ece4') }), { body: M('#ffffff'), dark: M('#ffffff'), light: M('#ffffff') }, null);
for (const [k, r] of Object.entries(report)) console.log(`${k}: ${(r.bytes / 1024).toFixed(1)} KB, ${r.tris} tris, ${r.bones} bones, clips ${r.clips.join(' ')}\n   ${JSON.stringify(r.parts)}`);
fs.writeFileSync(path.join(OUT, 'all', 'characters-manifest.json'), JSON.stringify(report, null, 2) + '\n');
