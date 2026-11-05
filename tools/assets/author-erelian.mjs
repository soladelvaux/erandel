// Authors the Erelian benchmark region's prefabs (ERANDEL_ART_BIBLE.md §16, docs/regions/erelian.md).
// Everything is generated in code, deterministically: organic meshes with painted vertex colour
// and one painted foliage atlas. Output:
//   assets/game/erelian/*.glb      meshopt-compressed, quantized prefab packs (lod0 + lod1 nodes)
//   assets/game/all/tex_all_foliage-atlas.ktx2   Basis ETC1S, mipmapped (GPU-compressed)
//   assets/game/all/tex_all_foliage-atlas.png    fallback when KTX2 cannot be transcoded
//   assets/source/all/tex_all_foliage-atlas_2x.png  2× master
// These are the region's v1 assets: genuine 3D meshes, made to be replaced prefab by prefab by
// hand-made or AI-assisted assets through the art bible's pipeline (§2.3) with the same names.
// Usage: npm install && npm run erelian   (inside tools/assets)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, dedup, prune } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { encodeToKTX2 } from 'ktx2-encoder';
import { PNG } from 'pngjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'assets', 'game');
const SRC = path.join(ROOT, 'assets', 'source');

/* ---------- deterministic noise ---------- */
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash3(i, j, k) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function noise3(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = x - i, fy = y - j, fz = z - k;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(i, j, k), hash3(i + 1, j, k), u), L(hash3(i, j + 1, k), hash3(i + 1, j + 1, k), u), v),
    L(L(hash3(i, j, k + 1), hash3(i + 1, j, k + 1), u), L(hash3(i, j + 1, k + 1), hash3(i + 1, j + 1, k + 1), u), v), w);
}
const fbm3 = (x, y, z) => noise3(x, y, z) * 0.6 + noise3(x * 2.1 + 7, y * 2.1 + 3, z * 2.1 + 5) * 0.3 + noise3(x * 4.3 + 1, y * 4.3 + 9, z * 4.3 + 2) * 0.1;
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- palette (ERANDEL_ART_BIBLE.md §4, sampled from R1) ---------- */
const P = {
  deep: hex('#212a23'), shadow: hex('#334036'), moss: hex('#516152'), sage: hex('#657c67'), lichen: hex('#91a283'), mist: hex('#bbcca6'),
  spire: hex('#acb8a5'), spireLight: hex('#d0d9c5'), bark: hex('#d8d2bf'), barkDark: hex('#8f8a78'), oak: hex('#5a4630'), oakDark: hex('#3a2d20'),
  leafWhite: hex('#9fbf86'), leafWhiteLight: hex('#cfe2ac'), leafGreen: hex('#4f7a3c'), leafGreenLight: hex('#86ad5a'),
  stone: hex('#9a9a8c'), stoneLight: hex('#c4c2b0'), stoneDark: hex('#5f6158'), ruin: hex('#c9c4b2'), ruinDark: hex('#8c8878'),
  mossBright: hex('#6f8f4a'), grass: hex('#5e8a45'), grassTip: hex('#a8c77a'), soil: hex('#4a4232'),
};

/* ---------- geometry helpers ---------- */
/** Adds a vertex-colour attribute computed per vertex from (position, normal). */
function paint(g, fn) {
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const col = fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), i); c[i * 3] = col[0]; c[i * 3 + 1] = col[1]; c[i * 3 + 2] = col[2]; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
/** Wind weight per vertex: 0 = rigid, 1 = moves most. */
function wind(g, fn) {
  const p = g.attributes.position, w = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) w[i] = clamp(fn(p.getX(i), p.getY(i), p.getZ(i)), 0, 1);
  g.setAttribute('_wind', new THREE.BufferAttribute(w, 1));
  return g;
}
function ensure(g, withUv) {
  if (!g.attributes.uv && withUv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  if (!withUv && g.attributes.uv) g.deleteAttribute('uv');
  if (!g.attributes._wind) wind(g, () => 0);
  return g;
}
function merge(list, withUv) { return mergeGeometries(list.map((g) => ensure(g.index ? g.toNonIndexed() : g, withUv))); }

/** A tube along a path with per-point radius; optional root flare. Returns indexed geometry. */
function tube(pts, radii, radial, o = {}) {
  const pos = [], idx = [];
  let prevN = null;
  for (let s = 0; s < pts.length; s++) {
    const a = pts[Math.max(0, s - 1)], b = pts[Math.min(pts.length - 1, s + 1)];
    const T = new THREE.Vector3().subVectors(b, a).normalize();
    let N;
    if (!prevN) { N = Math.abs(T.y) < 0.9 ? new THREE.Vector3(0, 1, 0).cross(T).normalize() : new THREE.Vector3(1, 0, 0).cross(T).normalize(); }
    else { N = prevN.clone().sub(T.clone().multiplyScalar(prevN.dot(T))).normalize(); }
    prevN = N; const B = new THREE.Vector3().crossVectors(T, N);
    for (let r = 0; r <= radial; r++) {
      const ang = (r / radial) * Math.PI * 2;
      let rad = radii[s];
      if (o.flare && s < o.flare.n) { const k = 1 - s / o.flare.n; rad *= 1 + o.flare.amt * k * k * (0.55 + 0.45 * Math.cos(ang * o.flare.roots + o.flare.phase)); }
      if (o.bumpy) rad *= 1 + o.bumpy * (noise3(Math.cos(ang) * 2 + s * 0.3, Math.sin(ang) * 2, s * 0.21) - 0.5);
      const p = pts[s].clone().addScaledVector(N, Math.cos(ang) * rad).addScaledVector(B, Math.sin(ang) * rad);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let s = 0; s < pts.length - 1; s++) for (let r = 0; r < radial; r++) { const a = s * (radial + 1) + r, b = a + 1, c = a + radial + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
/** A curved limb path: start, direction, length, bend, steps. */
function limb(start, dir, len, bend, steps, rng) {
  const pts = [start.clone()]; const d = dir.clone().normalize(); const p = start.clone();
  for (let i = 1; i <= steps; i++) {
    d.add(new THREE.Vector3((rng() - 0.5) * bend, bend * 0.35, (rng() - 0.5) * bend)).normalize();
    p.addScaledVector(d, len / steps); pts.push(p.clone());
  }
  return pts;
}

/* ---------- foliage cards (atlas regions, v down: glTF convention) ---------- */
const ATLAS = { leaf: [0, 0, 0.5, 0.5], grass: [0.5, 0, 1, 0.5], fern: [0, 0.5, 0.5, 1], flower: [0.5, 0.5, 1, 1] };
/** One quad card centred at c with normal-ish facing f, size w×h, its normals pointing away from `from` (soft volume shading). */
function card(c, right, up, w, h, rect, from, col, windW, bottomAnchored) {
  const [u0, v0, u1, v1] = rect;
  const o = bottomAnchored ? c.clone() : c.clone().addScaledVector(up, -h / 2);
  const corners = [o.clone().addScaledVector(right, -w / 2), o.clone().addScaledVector(right, w / 2), o.clone().addScaledVector(right, w / 2).addScaledVector(up, h), o.clone().addScaledVector(right, -w / 2).addScaledVector(up, h)];
  const uv = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
  const pos = [], nor = [], uvs = [], cols = [], winds = [];
  for (const k of [0, 1, 2, 0, 2, 3]) {
    const p = corners[k]; pos.push(p.x, p.y, p.z);
    const n = from ? p.clone().sub(from).normalize() : new THREE.Vector3().crossVectors(right, up).normalize();
    nor.push(n.x, n.y, n.z); uvs.push(uv[k][0], uv[k][1]);
    const cc = typeof col === 'function' ? col(p, k) : col; cols.push(...cc);
    winds.push(typeof windW === 'function' ? windW(p, k) : windW);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setAttribute('_wind', new THREE.Float32BufferAttribute(winds, 1));
  return g;
}
/** A painted canopy clump: cards scattered in an ellipsoid, normals radial, darker at the core and underside. */
function clump(center, R, n, rng, light, dark, canopyTop, canopyBottom, cardSize) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const dir = new THREE.Vector3(rng() * 2 - 1, rng() * 1.6 - 0.6, rng() * 2 - 1).normalize();
    const r = R * (0.35 + 0.65 * Math.sqrt(rng()));
    const c = center.clone().addScaledVector(dir, r).multiply(new THREE.Vector3(1, 0.8, 1).addScaledVector(new THREE.Vector3(0, 0, 0), 0)).add(new THREE.Vector3(0, 0, 0));
    const f = new THREE.Vector3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize();
    const right = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0.01)).normalize(); const up = new THREE.Vector3().crossVectors(right, f).normalize();
    const s = cardSize * (0.75 + rng() * 0.5);
    const col = (p) => {
      const hT = smooth(canopyBottom, canopyTop, p.y);
      const out = p.clone().sub(center).length() / R;
      const t = clamp(0.25 + 0.5 * hT + 0.35 * out + (rng() - 0.5) * 0.15, 0, 1);
      return mix(dark, light, t);
    };
    out.push(card(c, right, up, s, s, ATLAS.leaf, center.clone().add(new THREE.Vector3(0, -R * 0.4, 0)), col, (p) => clamp(0.55 + (p.y - canopyBottom) * 0.05, 0.5, 1)));
  }
  return out;
}

/* ---------- prefab generators ---------- */
/** Tree: trunk with root flare, branches, painted leaf-card canopy. */
function tree(o) {
  const rng = mulberry(o.seed);
  const H = o.height, R0 = o.radius;
  const trunkPts = limb(new THREE.Vector3(0, -0.3, 0), new THREE.Vector3((rng() - 0.5) * 0.1, 1, (rng() - 0.5) * 0.1), H * 0.62, o.lod ? 0.12 : 0.16, o.lod ? 5 : 10, rng);
  const trunkR = trunkPts.map((_, i) => R0 * (1 - 0.55 * (i / (trunkPts.length - 1))));
  const wood = [tube(trunkPts, trunkR, o.lod ? 6 : 10, { flare: { n: o.lod ? 2 : 3, amt: o.flare, roots: 5, phase: rng() * 6 }, bumpy: o.lod ? 0 : 0.12 })];
  const tips = [];
  for (let b = 0; b < o.branches; b++) {
    const at = Math.floor(trunkPts.length * (0.45 + 0.5 * (b / o.branches)));
    const s = trunkPts[Math.min(at, trunkPts.length - 1)];
    const a = (b / o.branches) * Math.PI * 2 + rng() * 0.8;
    const dir = new THREE.Vector3(Math.cos(a), 0.55 + rng() * 0.5, Math.sin(a));
    const len = H * (0.28 + rng() * 0.16);
    const pts = limb(s, dir, len, 0.25, o.lod ? 3 : 5, rng);
    const r0 = trunkR[Math.min(at, trunkR.length - 1)] * 0.55;
    wood.push(tube(pts, pts.map((_, i) => r0 * (1 - 0.7 * i / (pts.length - 1))), o.lod ? 4 : 6));
    tips.push(pts[pts.length - 1], pts[Math.floor(pts.length * 0.6)]);
  }
  tips.push(trunkPts[trunkPts.length - 1].clone().add(new THREE.Vector3(0, 0.6, 0)));
  const woodG = paint(mergeGeometries(wood.map((g) => g.toNonIndexed())), (x, y, z, nx, ny, nz) => {
    const n = fbm3(x * 2.2, y * 0.6, z * 2.2);
    const groove = 0.5 + 0.5 * Math.sin(Math.atan2(z, x) * 9 + y * 0.8 + n * 3);
    const moss = smooth(1.5, 0.2, y) * smooth(0.45, 0.8, n) + (ny > 0.55 ? 0.35 : 0);
    let c = mix(o.barkDark, o.bark, 0.35 + 0.5 * groove * n + 0.15);
    c = mix(c, P.mossBright, clamp(moss, 0, 0.8));
    return mix(c, P.deep, smooth(0.8, -0.3, y) * 0.35);
  });
  wind(woodG, (x, y) => smooth(H * 0.35, H, y) * 0.25);
  const top = Math.max(...tips.map((t) => t.y)) + o.clumpR, bottom = Math.min(...tips.map((t) => t.y)) - o.clumpR;
  const leaves = [];
  tips.forEach((t, i) => leaves.push(...clump(t, o.clumpR * (0.8 + rng() * 0.4), o.cards, rng, o.leafLight, o.leafDark, top, bottom, o.cardSize)));
  return { wood: ensure(woodG, false), foliage: merge(leaves, true) };
}

/** Fractured, moss-topped rock. */
function rock(o) {
  const rng = mulberry(o.seed);
  let g = new THREE.IcosahedronGeometry(1, o.lod ? 1 : 3); g = mergeVertices(g.toNonIndexed().deleteAttribute('normal').deleteAttribute('uv'));
  const p = g.attributes.position; const cuts = [];
  for (let i = 0; i < o.cuts; i++) { const n = new THREE.Vector3(rng() * 2 - 1, rng() * 1.2 - 0.2, rng() * 2 - 1).normalize(); cuts.push([n, 0.55 + rng() * 0.3]); }
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    v.multiplyScalar(1 + (fbm3(v.x * 1.3 + o.seed, v.y * 1.3, v.z * 1.3) - 0.5) * 0.45);
    for (const [n, d] of cuts) { const k = v.dot(n); if (k > d) v.addScaledVector(n, d - k); }
    v.multiply(o.scale); if (v.y < -0.15 * o.scale.y) v.y = -0.15 * o.scale.y - (v.y + 0.15 * o.scale.y) * 0.1;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  paint(g, (x, y, z, nx, ny, nz) => {
    const n = fbm3(x * 1.7, y * 1.7, z * 1.7);
    let c = mix(P.stoneDark, P.stoneLight, clamp(0.25 + 0.6 * n + 0.2 * ny, 0, 1));
    c = mix(c, P.mossBright, smooth(0.45, 0.85, ny) * smooth(0.35, 0.6, n) * o.moss);
    return mix(c, P.deep, smooth(0.25 * o.scale.y, -0.1, y) * 0.4);
  });
  return ensure(g.toNonIndexed(), false);
}

/** A worn stone block (box with chipped, jittered corners). */
function block(w, h, d, rng, wear, colA, colB) {
  let g = new THREE.BoxGeometry(w, h, d, 2, 2, 2); g = mergeVertices(g.deleteAttribute('normal').deleteAttribute('uv'));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const corner = (Math.abs(x) > w * 0.45 ? 1 : 0) + (Math.abs(y) > h * 0.45 ? 1 : 0) + (Math.abs(z) > d * 0.45 ? 1 : 0);
    const k = corner >= 2 ? wear * (0.4 + rng() * 0.8) : wear * 0.15 * rng();
    p.setXYZ(i, x * (1 - k / Math.max(w, 0.01) * 0.6), y * (1 - k / Math.max(h, 0.01) * 0.6), z * (1 - k / Math.max(d, 0.01) * 0.6));
  }
  const t = rng();
  const base = mix(colA, colB, t);
  return { g, base };
}
/** Places blocks into one painted geometry: [w,h,d, x,y,z, rotY] each. */
function masonry(list, seed, colA, colB, wear) {
  const rng = mulberry(seed); const parts = [];
  for (const [w, h, d, x, y, z, ry, rz] of list) {
    const { g, base } = block(w, h, d, rng, wear, colA, colB);
    g.rotateZ(rz || 0); g.rotateY(ry || 0); g.translate(x, y, z);
    paint(g, (px, py, pz, nx, ny, nz) => {
      const n = fbm3(px * 1.4, py * 1.4, pz * 1.4);
      let c = mix(base, P.stoneLight, (n - 0.5) * 0.5 + 0.1);
      c = mix(c, P.mossBright, smooth(0.6, 0.95, ny) * smooth(0.4, 0.62, n) * 0.85);
      c = mix(c, P.mossBright, smooth(1.2, 0.0, py) * smooth(0.45, 0.7, n) * 0.6);
      return mix(c, P.deep, smooth(0.6, -0.2, py) * 0.3);
    });
    parts.push(g.toNonIndexed());
  }
  return ensure(mergeGeometries(parts), false);
}
/** Fluted column drum with a jagged broken top. */
function brokenPillar(o) {
  const rng = mulberry(o.seed); const radial = o.lod ? 10 : 20;
  let g = new THREE.CylinderGeometry(o.r * 0.92, o.r, o.h, radial, o.lod ? 4 : 10, false);
  g = mergeVertices(g.deleteAttribute('normal').deleteAttribute('uv')); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i) + o.h / 2, z = p.getZ(i); const a = Math.atan2(z, x);
    const flute = 1 - 0.05 * Math.max(0, Math.cos(a * 12));
    const rr = Math.hypot(x, z); if (rr > 0.01) { x *= flute; z *= flute; }
    const cut = o.h * (0.72 + 0.22 * noise3(Math.cos(a) * 2 + o.seed, Math.sin(a) * 2, 0.5));
    if (y > cut) y = cut - (rr < 0.01 ? 0.15 : 0) - rng() * 0.08;
    p.setXYZ(i, x, y, z);
  }
  paint(g, (x, y, z, nx, ny) => { const n = fbm3(x * 2, y * 1.5, z * 2); let c = mix(P.ruinDark, P.ruin, 0.3 + 0.6 * n); c = mix(c, P.mossBright, (smooth(0.6, 0.9, ny) + smooth(1.4, 0, y) * 0.8) * smooth(0.4, 0.65, n)); return mix(c, P.deep, smooth(0.5, -0.2, y) * 0.3); });
  const plinth = masonry([[o.r * 2.6, 0.5, o.r * 2.6, 0, 0.25, 0]], o.seed + 1, P.ruinDark, P.ruin, 0.08);
  return merge([g.toNonIndexed(), plinth], false);
}
/** Pale spire after R1: tapered octagonal shaft, ring mouldings, window slits, pointed cap, ivy. */
function spire(o) {
  const radial = 12; const parts = [];
  let shaft = new THREE.CylinderGeometry(o.r * 0.72, o.r, o.h, radial, o.lod ? 4 : 16, false); shaft.translate(0, o.h / 2, 0);
  shaft = shaft.toNonIndexed().deleteAttribute('uv');
  paint(shaft, (x, y, z, nx, ny) => {
    const a = Math.atan2(z, x), n = fbm3(x * 1.2, y * 0.5, z * 1.2);
    let c = mix(P.spire, P.spireLight, 0.45 + 0.5 * n);
    c = mix(c, P.ruinDark, smooth(o.h * 0.3, 0, y) * 0.35);
    const ivy = smooth(o.h * 0.45, 0, y) * smooth(0.55, 0.72, fbm3(x * 0.8 + 3, y * 0.35, z * 0.8));
    c = mix(c, P.leafGreen, ivy * 0.9);
    return c;
  });
  parts.push(shaft);
  for (let k = 1; k <= 3; k++) { const y = (o.h * k) / 3.6; const rr = o.r * (1 - 0.28 * (y / o.h)) + 0.18; let ring = new THREE.CylinderGeometry(rr, rr, 0.35, radial); ring.translate(0, y, 0); ring = ring.toNonIndexed().deleteAttribute('uv'); paint(ring, () => P.spireLight); parts.push(ring); }
  let cap = new THREE.ConeGeometry(o.r * 0.95, o.h * 0.32, radial, o.lod ? 1 : 4); cap.translate(0, o.h + o.h * 0.16, 0); cap = cap.toNonIndexed().deleteAttribute('uv');
  paint(cap, (x, y, z) => mix(hex('#6e8a6a'), hex('#9fb59a'), fbm3(x * 2, y, z * 2)));
  parts.push(cap);
  let fin = new THREE.ConeGeometry(0.12, 1.4, 6); fin.translate(0, o.h * 1.32 + 0.7, 0); fin = fin.toNonIndexed().deleteAttribute('uv'); paint(fin, () => hex('#d8c98a')); parts.push(fin);
  const base = masonry([[o.r * 2.8, 0.8, o.r * 2.8, 0, 0.4, 0]], o.seed, P.ruinDark, P.ruin, 0.12);
  return merge([...parts, base], false);
}
/** Ruined arch: two piers and a ring of voussoirs. */
function ruinArch(o) {
  const L = []; const span = 4.2, pierH = 3.2;
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) L.push([1.2, 0.8, 1.2, sx * (span / 2 + 0.6), 0.4 + k * 0.8, 0, (k % 2) * 0.05]);
  const n = o.lod ? 7 : 11, R = span / 2 + 0.6;
  for (let i = 0; i < n; i++) { if (o.broken && i > n - 4) continue; const a = Math.PI * (i + 0.5) / n; L.push([1.2, 0.62, 1.15, -Math.cos(a) * R, pierH + Math.sin(a) * R, 0, 0, a - Math.PI / 2]); }
  return masonry(L, o.seed, P.ruinDark, P.ruin, 0.1);
}
/** Ruined wall with a broken, stepped top. */
function ruinWall(o) {
  const rng = mulberry(o.seed); const L = []; const len = 7, rows = 5;
  for (let r = 0; r < rows; r++) {
    let x = -len / 2 + (r % 2) * 0.5;
    while (x < len / 2) { const w = 0.9 + rng() * 0.7; const top = 0.6 + rows * 0.75 * (0.45 + 0.55 * noise3(x * 0.4 + o.seed, 0, 0)); if ((r + 1) * 0.7 < top) L.push([w - 0.06, 0.66, 0.9, x + w / 2, 0.35 + r * 0.7, 0]); x += w; }
  }
  return masonry(L, o.seed, P.ruinDark, P.ruin, 0.1);
}
/** Wide stairs: `steps` steps rising `rise` over `run` (+x is down, so the top is at -x), with side walls. */
function stairs(o) {
  const L = []; const n = o.steps, w = o.width, sr = o.rise / n, sl = o.run / n;
  for (let i = 0; i < n; i++) { const y = sr * (i + 1), x = -sl * i - sl / 2; L.push([sl + 0.04, y + 0.3, w, x, (y + 0.3) / 2 - 0.3, 0]); }
  for (const sz of [-1, 1]) for (let i = 0; i < n; i += 2) { const y = sr * (i + 2) + 0.55; L.push([sl * 2 + 0.02, 0.5, 0.6, -sl * i - sl, y, sz * (w / 2 + 0.3)]); }
  return masonry(L, o.seed, P.ruinDark, P.ruin, 0.05);
}
/** Arched stone bridge along x, deck top at y=deckY at the ends, hump at the middle. */
function bridge(o) {
  const half = o.length / 2, span = o.span, rise = o.archRise, d = o.width;
  const shape = new THREE.Shape(); const N = o.lod ? 10 : 24;
  shape.moveTo(-half, -3.2);
  for (let i = 0; i <= N; i++) { const x = -half + (o.length * i) / N; shape.lineTo(x, o.deckY + o.hump * (1 - (x / half) ** 2)); }
  shape.lineTo(half, -3.2);
  const hole = new THREE.Path(); hole.moveTo(span / 2, -3.2);
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI; hole.lineTo(Math.cos(a) * span / 2, o.springY + Math.sin(a) * rise); }
  hole.lineTo(-span / 2, -3.2); hole.lineTo(span / 2, -3.2); shape.holes.push(hole);
  let body = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 4 }); body.translate(0, 0, -d / 2);
  body = body.toNonIndexed().deleteAttribute('uv');
  paint(body, (x, y, z, nx, ny, nz) => {
    const n = fbm3(x * 1.1, y * 1.1, z * 1.1); const course = Math.abs(((y + 10) / 0.55) % 1 - 0.5) < 0.06 ? 0.75 : 1;
    let c = mix(P.ruinDark, P.ruin, (0.3 + 0.6 * n) * course);
    c = mix(c, P.mossBright, smooth(1.0, -1.5, y) * smooth(0.4, 0.65, n) * 0.8);
    if (ny > 0.8) c = mix(hex('#8d8a7c'), hex('#a8a493'), n);
    return mix(c, P.deep, smooth(-0.5, -3, y) * 0.5);
  });
  const L = []; const rng = mulberry(o.seed);
  for (const sz of [-1, 1]) for (let x = -half + 0.5; x < half; x += 1.05) { const y = o.deckY + o.hump * (1 - (x / half) ** 2); if (rng() < 0.12) continue; L.push([1.0, 0.55, 0.38, x, y + 0.27, sz * (d / 2 - 0.2)]); }
  // arch ring: flush voussoir faces on both sides of the arch (they used to stand out below the arch like teeth)
  for (let i = 1; i < 12; i++) { if (o.lod) break; const a = (i / 12) * Math.PI; for (const sz of [-1, 1]) L.push([0.55, 0.42, 0.05, Math.cos(a) * (span / 2 + 0.24), o.springY + Math.sin(a) * (rise + 0.22), sz * (d / 2 + 0.01), 0, a - Math.PI / 2]); }
  return merge([body, masonry(L, o.seed + 3, P.ruinDark, P.ruin, 0.06)], false);
}
/** Fallen, mossy log. */
function log(o) {
  const rng = mulberry(o.seed); const pts = []; for (let i = 0; i <= 6; i++) pts.push(new THREE.Vector3(-o.len / 2 + (o.len * i) / 6, o.r * 0.8 + (rng() - 0.5) * 0.08, (rng() - 0.5) * 0.2));
  const g = paint(tube(pts, pts.map((_, i) => o.r * (1 - 0.25 * i / 6)), o.lod ? 6 : 10, { bumpy: 0.15 }).toNonIndexed(), (x, y, z, nx, ny) => { const n = fbm3(x * 2, y * 2, z * 2); return mix(mix(P.oakDark, P.oak, n), P.mossBright, smooth(0.3, 0.9, ny) * smooth(0.35, 0.6, n)); });
  return ensure(g, false);
}
/** Ground cover: crossed curved cards from the atlas. */
function cover(o) {
  const rng = mulberry(o.seed); const cards = [];
  for (let i = 0; i < o.n; i++) {
    const a = (i / o.n) * Math.PI + rng() * 0.4; const right = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); const lean = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar((rng() - 0.5) * o.lean);
    const up = new THREE.Vector3(0, 1, 0).add(lean).normalize(); const c = new THREE.Vector3((rng() - 0.5) * o.spread, 0, (rng() - 0.5) * o.spread);
    const w = o.w * (0.8 + rng() * 0.4), h = o.h * (0.8 + rng() * 0.4);
    cards.push(card(c, right, up, w, h, ATLAS[o.atlas], null, (p) => mix(o.base, o.tip, smooth(0, h, p.y)), (p) => smooth(0, h, p.y), true));
    const g = cards[cards.length - 1]; const n = g.attributes.normal; for (let k = 0; k < n.count; k++) n.setXYZ(k, 0, 1, 0);
  }
  return merge(cards, true);
}
/** Fern: arched fronds radiating from the centre. */
function fern(o) {
  const rng = mulberry(o.seed); const parts = [];
  for (let i = 0; i < o.n; i++) {
    const a = (i / o.n) * Math.PI * 2 + rng() * 0.3; const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const segs = o.lod ? 2 : 4, len = o.len * (0.8 + rng() * 0.4); const pos = [], uv = [], col = [], wnd = [], nor = []; const [u0, v0, u1, v1] = ATLAS.fern;
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    for (let s = 0; s <= segs; s++) { const t = s / segs; const c = dir.clone().multiplyScalar(len * t); c.y = Math.sin(t * Math.PI * 0.85) * len * 0.45; for (const sd of [-1, 1]) { const p = c.clone().addScaledVector(right, sd * 0.2); pos.push(p.x, p.y, p.z); uv.push(sd < 0 ? u0 : u1, v1 - (v1 - v0) * t); const cc = mix(P.leafGreen, P.leafGreenLight, t); col.push(...cc); wnd.push(t); nor.push(0, 1, 0); } }
    const idx = []; for (let s = 0; s < segs; s++) { const k = s * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('_wind', new THREE.Float32BufferAttribute(wnd, 1)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
    parts.push(g.toNonIndexed());
  }
  return mergeGeometries(parts);
}

/* ---------- the prefab list ---------- */
const WHITE = { bark: P.bark, barkDark: P.barkDark, leafLight: P.leafWhiteLight, leafDark: P.moss, flare: 0.9 };
const GREEN = { bark: P.oak, barkDark: P.oakDark, leafLight: P.leafGreenLight, leafDark: P.shadow, flare: 0.7 };
const two = (fn, o, lod1) => [fn({ ...o, lod: 0 }), fn({ ...o, ...lod1, lod: 1 })];
const PACKS = {
  'veg_erelian_trees': {
    'veg_erelian_white-tree_hero': two(tree, { ...WHITE, seed: 11, height: 15, radius: 1.15, branches: 7, clumpR: 2.4, cards: 34, cardSize: 1.9, flare: 1.4 }, { cards: 12, cardSize: 3.0 }),
    'veg_erelian_white-tree_a': two(tree, { ...WHITE, seed: 21, height: 8.5, radius: 0.42, branches: 5, clumpR: 1.5, cards: 22, cardSize: 1.35 }, { cards: 7, cardSize: 2.2 }),
    'veg_erelian_white-tree_b': two(tree, { ...WHITE, seed: 22, height: 10, radius: 0.5, branches: 4, clumpR: 1.7, cards: 24, cardSize: 1.45 }, { cards: 8, cardSize: 2.3 }),
    'veg_erelian_green-tree_a': two(tree, { ...GREEN, seed: 31, height: 9, radius: 0.55, branches: 5, clumpR: 1.9, cards: 26, cardSize: 1.5 }, { cards: 8, cardSize: 2.5 }),
    'veg_erelian_green-tree_b': two(tree, { ...GREEN, seed: 32, height: 7, radius: 0.45, branches: 4, clumpR: 1.6, cards: 22, cardSize: 1.35 }, { cards: 7, cardSize: 2.2 }),
  },
  'env_erelian_rocks': {
    'env_erelian_rock_a': [rock({ seed: 1, cuts: 4, scale: new THREE.Vector3(1.2, 0.8, 1.0), moss: 1 }), rock({ seed: 1, cuts: 4, scale: new THREE.Vector3(1.2, 0.8, 1.0), moss: 1, lod: 1 })],
    'env_erelian_rock_b': [rock({ seed: 2, cuts: 5, scale: new THREE.Vector3(0.9, 1.1, 0.8), moss: 0.7 }), rock({ seed: 2, cuts: 5, scale: new THREE.Vector3(0.9, 1.1, 0.8), moss: 0.7, lod: 1 })],
    'env_erelian_rock_flat': [rock({ seed: 3, cuts: 3, scale: new THREE.Vector3(1.6, 0.45, 1.3), moss: 1 }), rock({ seed: 3, cuts: 3, scale: new THREE.Vector3(1.6, 0.45, 1.3), moss: 1, lod: 1 })],
    'env_erelian_boulder_cliff': [merge([rock({ seed: 4, cuts: 5, scale: new THREE.Vector3(2.6, 2.2, 2.2), moss: 0.8 }), rock({ seed: 5, cuts: 4, scale: new THREE.Vector3(1.8, 1.4, 1.6), moss: 0.8 }).translate(1.9, 0.9, 0.8), rock({ seed: 6, cuts: 4, scale: new THREE.Vector3(1.4, 1.0, 1.2), moss: 1 }).translate(-1.6, 0.2, 1.2)], false),
      merge([rock({ seed: 4, cuts: 5, scale: new THREE.Vector3(2.6, 2.2, 2.2), moss: 0.8, lod: 1 }), rock({ seed: 5, cuts: 4, scale: new THREE.Vector3(1.8, 1.4, 1.6), moss: 0.8, lod: 1 }).translate(1.9, 0.9, 0.8)], false)],
    'veg_erelian_log': [log({ seed: 7, len: 6, r: 0.42 }), log({ seed: 7, len: 6, r: 0.42, lod: 1 })],
  },
  'env_erelian_ruins': {
    'env_erelian_spire_a': [spire({ seed: 41, h: 16, r: 1.3 }), spire({ seed: 41, h: 16, r: 1.3, lod: 1 })],
    'env_erelian_spire_b': [spire({ seed: 42, h: 21, r: 1.5 }), spire({ seed: 42, h: 21, r: 1.5, lod: 1 })],
    'env_erelian_ruin-arch': [ruinArch({ seed: 43 }), ruinArch({ seed: 43, lod: 1 })],
    'env_erelian_ruin-arch_broken': [ruinArch({ seed: 44, broken: 1 }), ruinArch({ seed: 44, broken: 1, lod: 1 })],
    'env_erelian_ruin-wall': [ruinWall({ seed: 45 }), ruinWall({ seed: 45 })],
    'env_erelian_ruin-pillar': [brokenPillar({ seed: 46, r: 0.55, h: 4.2 }), brokenPillar({ seed: 46, r: 0.55, h: 4.2, lod: 1 })],
    'env_erelian_ruin-pillar_short': [brokenPillar({ seed: 47, r: 0.55, h: 2.2 }), brokenPillar({ seed: 47, r: 0.55, h: 2.2, lod: 1 })],
    'env_erelian_stairs': [stairs({ seed: 48, steps: 20, rise: 5, run: 8, width: 4 }), stairs({ seed: 48, steps: 20, rise: 5, run: 8, width: 4 })],
    'env_erelian_bridge': [bridge({ seed: 49, length: 14, span: 8.5, archRise: 2.6, springY: -0.6, deckY: 2.2, hump: 0.6, width: 3.4 }), bridge({ seed: 49, length: 14, span: 8.5, archRise: 2.6, springY: -0.6, deckY: 2.2, hump: 0.6, width: 3.4, lod: 1 })],
  },
  'veg_all_groundcover': {
    'veg_all_grass-clump': [cover({ seed: 51, n: 3, w: 1.1, h: 0.7, spread: 0.3, lean: 0.5, atlas: 'grass', base: P.grass, tip: P.grassTip })],
    'veg_all_grass-tall': [cover({ seed: 52, n: 4, w: 1.0, h: 1.2, spread: 0.4, lean: 0.6, atlas: 'grass', base: P.shadow, tip: P.grassTip })],
    'veg_all_flowers': [cover({ seed: 53, n: 3, w: 0.9, h: 0.75, spread: 0.4, lean: 0.4, atlas: 'flower', base: [0.85, 0.85, 0.8], tip: [1, 1, 1] })],
    'veg_all_fern': [fern({ seed: 54, n: 9, len: 1.1 })],
    'veg_all_reeds': [cover({ seed: 55, n: 4, w: 0.7, h: 1.6, spread: 0.6, lean: 0.3, atlas: 'grass', base: P.moss, tip: P.lichen })],
    'veg_all_bush': [merge(clump(new THREE.Vector3(0, 0.6, 0), 0.8, 14, mulberry(56), P.leafGreenLight, P.shadow, 1.4, 0, 0.9), true)],
  },
};

/* ---------- painted foliage atlas (2× master, downsampled) ---------- */
function paintAtlas() {
  const S = 2048, buf = new Float32Array(S * S * 4); const rng = mulberry(777);
  function dab(cx, cy, rx, ry, ang, col, alpha) {
    const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.max(rx, ry) + 2;
    for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(S, cy + R); y++) for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(S, cx + R); x++) {
      const dx = x - cx, dy = y - cy, u = (dx * ca + dy * sa) / rx, v = (-dx * sa + dy * ca) / ry, d = Math.sqrt(u * u + v * v);
      const cov = clamp((1 - d) * Math.min(rx, ry) * 0.9, 0, 1) * alpha; if (cov <= 0) continue;
      const k = (y * S + x) * 4; for (let c = 0; c < 3; c++) buf[k + c] = buf[k + c] * (1 - cov) + col[c] * cov; buf[k + 3] = buf[k + 3] + (1 - buf[k + 3]) * cov;
    }
  }
  const Q = 1024; // quadrant size at 2×
  // leaf mass (top-left): layered leaf dabs, lighter toward the top, ragged edge
  { const cx = Q / 2, cy = Q / 2, R = Q * 0.43;
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 520; i++) {
      const a = rng() * Math.PI * 2, r = R * Math.sqrt(rng()); const edge = R * (0.78 + 0.22 * noise3(Math.cos(a) * 3, Math.sin(a) * 3, layer));
      if (r > edge) continue; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.92;
      const lum = clamp(0.5 + 0.28 * (1 - (y - cy + R) / (2 * R)) + layer * 0.08 + (rng() - 0.5) * 0.14, 0.3, 1);
      const ang = a + (rng() - 0.5) * 1.2; dab(x, y, 30 + rng() * 14, 12 + rng() * 6, ang, [lum * 0.97, lum, lum * 0.92], 1);
      dab(x - 5, y - 5, 14, 5, ang, [Math.min(1, lum + 0.16), Math.min(1, lum + 0.18), Math.min(1, lum + 0.12)], 0.8);
    } }
  // grass blades (top-right)
  { const ox = Q; for (let i = 0; i < 90; i++) {
    const bx = ox + 80 + rng() * (Q - 160), h = Q * (0.45 + rng() * 0.5), lean = (rng() - 0.5) * 260, w = 10 + rng() * 9;
    for (let t = 0; t <= 1; t += 0.006) { const x = bx + lean * t * t, y = Q - 4 - h * t, lum = 0.32 + 0.66 * t; dab(x, y, w * (1 - t * 0.92) + 1, w * (1 - t * 0.92) + 1, 0, [lum * 0.95, lum, lum * 0.85], 1); }
  } }
  // fern frond (bottom-left)
  { const oy = Q; for (let t = 0; t <= 1; t += 0.004) { const x = Q / 2 + Math.sin(t * 2.2) * 30, y = oy + Q - 20 - t * (Q - 60); dab(x, y, 7, 7, 0, [0.5, 0.55, 0.45], 1);
      if (Math.floor(t * 240) % 9 === 0) for (const sd of [-1, 1]) { const L = (1 - t) * 300 + 40, lum = 0.55 + 0.4 * t; for (let s = 0; s <= 1; s += 0.03) dab(x + sd * L * s, y - s * L * 0.25, 16 * (1 - s * 0.7), 16 * (1 - s * 0.7), 0, [lum * 0.92, lum, lum * 0.85], 1); } } }
  // flowers (bottom-right): small five-petal flowers over a few blades
  { const ox = Q, oy = Q;
    for (let i = 0; i < 40; i++) { const bx = ox + 100 + rng() * (Q - 200), h = Q * (0.25 + rng() * 0.3); for (let t = 0; t <= 1; t += 0.01) { const lum = 0.35 + 0.4 * t; dab(bx + (rng() - 0.5) * 2, oy + Q - 4 - h * t, 9 * (1 - t * 0.9) + 1, 9 * (1 - t * 0.9) + 1, 0, [lum * 0.7, lum * 0.85, lum * 0.55], 1); } }
    const cols = [[0.97, 0.95, 0.88], [0.96, 0.82, 0.86], [0.95, 0.84, 0.48], [0.9, 0.93, 0.98]];
    for (let i = 0; i < 26; i++) { const x = ox + 110 + rng() * (Q - 220), y = oy + 120 + rng() * (Q * 0.55); const c = cols[i % 4], pr = 34 + rng() * 14;
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + rng(); dab(x + Math.cos(a) * pr * 0.55, y + Math.sin(a) * pr * 0.55, pr * 0.55, pr * 0.32, a, c, 1); }
      dab(x, y, pr * 0.24, pr * 0.24, 0, [0.85, 0.66, 0.25], 1); } }
  // 2× → 1×, and fill transparent texels with a neutral colour so mipmaps don't fringe dark
  const s = 1024, out = new Uint8Array(s * s * 4), master = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S * 4; i++) master[i] = Math.round(clamp(buf[i], 0, 1) * 255);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    let r = 0, g = 0, b = 0, a = 0; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const k = ((y * 2 + j) * S + x * 2 + i) * 4; r += buf[k] * buf[k + 3]; g += buf[k + 1] * buf[k + 3]; b += buf[k + 2] * buf[k + 3]; a += buf[k + 3]; }
    const k = (y * s + x) * 4; if (a > 0.001) { out[k] = Math.round((r / a) * 255); out[k + 1] = Math.round((g / a) * 255); out[k + 2] = Math.round((b / a) * 255); } else { out[k] = 150; out[k + 1] = 158; out[k + 2] = 135; }
    out[k + 3] = Math.round(clamp(a / 4, 0, 1) * 255);
  }
  return { out, size: s, master, masterSize: S };
}
function png(data, size) { const p = new PNG({ width: size, height: size }); p.data = Buffer.from(data); return PNG.sync.write(p); }

/* ---------- export ---------- */
async function writePack(name, prefabs) {
  const doc = new Document(); const buffer = doc.createBuffer(); const scene = doc.createScene(name);
  const mats = { painted: doc.createMaterial('erandel-painted').setRoughnessFactor(0.85).setMetallicFactor(0), foliage: doc.createMaterial('erandel-foliage').setRoughnessFactor(0.9).setMetallicFactor(0).setAlphaMode('MASK').setAlphaCutoff(0.45).setDoubleSided(true) };
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buffer);
  const stats = {};
  for (const [prefab, lods] of Object.entries(prefabs)) {
    lods.forEach((lod, li) => {
      const mesh = doc.createMesh(`${prefab}_lod${li}`); let tris = 0;
      const parts = lod.isBufferGeometry ? [[lod, lod.attributes.uv ? 'foliage' : 'painted']] : [[lod.wood, 'painted'], [lod.foliage, 'foliage']];
      for (const [g0, m] of parts) {
        const g = mergeVertices(g0.index ? g0.toNonIndexed() : g0, 1e-4);
        const prim = doc.createPrimitive().setMaterial(mats[m]).setIndices(acc('SCALAR', new Uint32Array(g.index.array)));
        prim.setAttribute('POSITION', acc('VEC3', new Float32Array(g.attributes.position.array)));
        if (!g.attributes.normal) g.computeVertexNormals();
        prim.setAttribute('NORMAL', acc('VEC3', new Float32Array(g.attributes.normal.array)));
        prim.setAttribute('COLOR_0', acc('VEC3', new Float32Array(g.attributes.color.array)));
        prim.setAttribute('_WIND', acc('SCALAR', new Float32Array(g.attributes._wind.array)));
        if (m === 'foliage') prim.setAttribute('TEXCOORD_0', acc('VEC2', new Float32Array(g.attributes.uv.array)));
        mesh.addPrimitive(prim); tris += g.index.count / 3;
      }
      scene.addChild(doc.createNode(`${prefab}_lod${li}`).setMesh(mesh));
      (stats[prefab] = stats[prefab] || []).push(Math.round(tris));
    });
  }
  await MeshoptEncoder.ready;
  await doc.transform(dedup(), prune({ keepAttributes: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const file = path.join(OUT, 'erelian', `${name}.glb`); fs.mkdirSync(path.dirname(file), { recursive: true });
  await io.write(file, doc);
  return { file, bytes: fs.statSync(file).size, stats };
}

const report = { generated: new Date().toISOString().slice(0, 10), packs: {}, textures: {} };
for (const [name, prefabs] of Object.entries(PACKS)) {
  const r = await writePack(name, prefabs); report.packs[name] = { bytes: r.bytes, triangles: r.stats };
  console.log(`${name}.glb  ${(r.bytes / 1024).toFixed(1)} KB`); for (const [k, v] of Object.entries(r.stats)) console.log(`   ${k.padEnd(34)} tris lod0 ${v[0]}${v[1] != null ? '  lod1 ' + v[1] : ''}`);
}
const atlas = paintAtlas();
fs.mkdirSync(path.join(OUT, 'all'), { recursive: true }); fs.mkdirSync(path.join(SRC, 'all'), { recursive: true });
fs.writeFileSync(path.join(SRC, 'all', 'tex_all_foliage-atlas_2x.png'), png(atlas.master, atlas.masterSize));
const pngBytes = png(atlas.out, atlas.size); fs.writeFileSync(path.join(OUT, 'all', 'tex_all_foliage-atlas.png'), pngBytes);
const ktxLog = console.log; console.log = () => {};
const ktx = await encodeToKTX2(new Uint8Array(pngBytes), { isUASTC: false, generateMipmap: true, qualityLevel: 200, compressionLevel: 2, isSetKTX2SRGBTransferFunc: false, imageDecoder: async () => ({ data: atlas.out, width: atlas.size, height: atlas.size }) });
console.log = ktxLog;
fs.writeFileSync(path.join(OUT, 'all', 'tex_all_foliage-atlas.ktx2'), ktx);
report.textures = { 'tex_all_foliage-atlas.ktx2': ktx.byteLength, 'tex_all_foliage-atlas.png': pngBytes.byteLength };
console.log(`tex_all_foliage-atlas.ktx2 ${(ktx.byteLength / 1024).toFixed(1)} KB (png fallback ${(pngBytes.byteLength / 1024).toFixed(1)} KB)`);
fs.writeFileSync(path.join(OUT, 'erelian', 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
